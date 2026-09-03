import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';
import { cyclesDue, martialLawMultiplier } from '../../shared/tickMath.ts';
import { totalResearchSpeedBonus } from '../../shared/researchSpeed.ts';
import { researchPointsPerHour } from '../../shared/researchPoints.ts';
import { researchPoolMaximum, clampResearchPool, allocationTotal } from '../../shared/researchAllocation.ts';
import { processBuildCompletions } from '../../shared/buildCompletion.ts';
import { economyProductionRates } from '../../shared/economyProduction.ts';

const VRIND_INCOME_UPGRADE_IDS = [
  'income_upgrade_i', 'income_upgrade_ii', 'income_upgrade_iii',
  'tax_office_i', 'tax_office_ii', 'tax_office_iii',
];

function recurringVrindMultiplier(empire) {
  const levels = empire?.empire_upgrade_levels || {};
  const bonuses = {
    income_upgrade_i: 0.05,
    income_upgrade_ii: 0.05,
    income_upgrade_iii: 0.05,
    tax_office_i: 0.05,
    tax_office_ii: 0.10,
    tax_office_iii: 0.15,
  };
  const bonus = VRIND_INCOME_UPGRADE_IDS.reduce((sum, id) => sum + (levels[id] > 0 ? bonuses[id] : 0), 0);
  return 1 + bonus;
}

const CYCLES_PER_HOUR = 60;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await authorizeTick(base44);
    if (!guard.ok) return guard.response;

    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const completedTech = await base44.asServiceRole.entities.TechProgress.filter({ status: 'completed' }, '-created_date', 5000);
    const completedByOwner = {};
    for (const c of completedTech) (completedByOwner[c.created_by_id] ||= new Set()).add(c.tech_id);

    const now = Date.now();
    const tickedAt = new Date().toISOString();
    let ticked = 0;
    let granted = 0;
    let vrindGranted = 0;
    let researchInvested = 0;
    let researchCompleted = 0;

    // Resource production and research-pool recharge.
    for (const empire of empires) {
      const due = cyclesDue(empire.last_tick_date, now);
      if (due <= 0) continue;

      const martialMultiplier = martialLawMultiplier(empire, now);
      const hours = due / CYCLES_PER_HOUR;
      const doneIds = completedByOwner[empire.created_by_id] || new Set();
      const rates = economyProductionRates(doneIds, empire.empire_upgrade_levels || {});

      const ferriteGrant = hours * rates.ferrite * martialMultiplier;
      const energyGrant = hours * rates.energy * martialMultiplier;
      const berentiumGrant = hours * rates.berentium * martialMultiplier;
      const aetheriumGrant = hours * rates.aetherium * martialMultiplier;
      const vrindGrant = due * martialMultiplier * recurringVrindMultiplier(empire);

      // Research Points are a renewable pool. Population sets the maximum
      // pool, and each elapsed hour replenishes up to one full pool.
      const maxResearchPool = researchPoolMaximum(empire.population || 0);
      const currentResearchPool = clampResearchPool(empire.research_points, empire.population || 0);
      const researchRefill = hours * maxResearchPool;
      const refilledResearchPool = Math.min(maxResearchPool, currentResearchPool + researchRefill);

      const inc = {
        ferrite_titanium: ferriteGrant,
        energy: energyGrant,
        vrind: vrindGrant,
        berentium: berentiumGrant,
        research_points: refilledResearchPool - (Number(empire.research_points) || 0),
      };
      if (aetheriumGrant > 0) inc.aetherium_crystal = aetheriumGrant;

      await base44.asServiceRole.entities.Empire.updateMany(
        { id: empire.id },
        { $inc: inc, $set: { last_tick_date: tickedAt } }
      );
      ticked += 1;
      granted += ferriteGrant + energyGrant + berentiumGrant + aetheriumGrant;
      vrindGranted += vrindGrant;
    }

    // Research now advances by consuming the player's renewable research pool.
    // Every active project receives its allocation percentage of the pool.
    // Allocation totals may be below 100%, allowing the remainder to bank.
    const empireByOwner = {};
    for (const e of empires) empireByOwner[e.created_by_id] = e;

    const researching = await base44.asServiceRole.entities.TechProgress.filter(
      { status: 'researching' }, '-created_date', 5000
    );
    const byOwner = {};
    for (const tp of researching) (byOwner[tp.created_by_id] ||= []).push(tp);

    for (const [owner, records] of Object.entries(byOwner)) {
      const empire = empireByOwner[owner];
      if (!empire) continue;
      const pool = Math.max(0, Number(empire.research_points) || 0);
      if (pool <= 0) continue;

      const totalAllocation = allocationTotal(records);
      if (totalAllocation <= 0) continue;

      const doneSet = completedByOwner[owner] || new Set();
      const speedBonus = totalResearchSpeedBonus(doneSet, empire.research_speed_level || 0);
      const availableForResearch = pool;
      const projects = records.map((tp) => ({
        tp,
        allocation: Math.max(0, Math.min(100, Number(tp.allocation_percent) || 0)),
        required: Math.max(1, Number(tp.research_points_required) || 500),
        invested: Math.max(0, Number(tp.research_points_invested) || 0),
      })).filter((p) => p.allocation > 0 && p.invested < p.required);

      let totalRequested = projects.reduce((sum, p) => sum + availableForResearch * (p.allocation / 100), 0);
      // Research speed bonuses increase effective RP throughput without ever
      // allowing more RP to be removed from the pool than actually exists.
      totalRequested *= (1 + Math.max(0, speedBonus));
      const spendRatio = totalRequested > availableForResearch ? availableForResearch / totalRequested : 1;
      let spent = 0;

      for (const project of projects) {
        const requested = availableForResearch * (project.allocation / 100) * (1 + Math.max(0, speedBonus));
        const invest = Math.min(project.required - project.invested, requested * spendRatio);
        if (invest <= 0) continue;
        const nextInvested = project.invested + invest;
        spent += invest;
        researchInvested += invest;
        const complete = nextInvested >= project.required - 0.000001;
        await base44.asServiceRole.entities.TechProgress.update(project.tp.id, {
          research_points_invested: complete ? project.required : nextInvested,
          progress: complete ? project.required : nextInvested,
          status: complete ? 'completed' : 'researching',
        });
        if (complete) {
          (completedByOwner[owner] ||= new Set()).add(project.tp.tech_id);
          researchCompleted += 1;
        }
      }

      if (spent > 0) {
        await base44.asServiceRole.entities.Empire.update(empire.id, {
          research_points: Math.max(0, pool - spent),
        });
      }
    }

    const allUnits = await base44.asServiceRole.entities.Unit.list('-created_date', 5000);
    const buildsCompleted = await processBuildCompletions(base44.asServiceRole, allUnits, now);

    return Response.json({ ok: true, ticked, granted, vrindGranted, researchInvested, researchCompleted, buildsCompleted, at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
