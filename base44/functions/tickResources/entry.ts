import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';
import { cyclesDue, martialLawMultiplier } from '../../shared/tickMath.ts';
import { totalResearchSpeedBonus, computeCompletionMs } from '../../shared/researchSpeed.ts';
import { researchPointsPerHour } from '../../shared/researchPoints.ts';
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

// Resource production is defined as an hourly rate. The game heartbeat remains
// one minute, so one hour of elapsed time equals 60 production cycles.
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

      // VRIND remains on its established production-cycle economy and is not
      // part of the new mineral/energy hourly balance unless an income upgrade
      // changes it.
      const vrindGrant = due * martialMultiplier * recurringVrindMultiplier(empire);
      const rpGrant = hours * researchPointsPerHour(empire.population || 0);

      const inc = {
        ferrite_titanium: ferriteGrant,
        energy: energyGrant,
        vrind: vrindGrant,
        berentium: berentiumGrant,
        research_points: rpGrant,
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

    // Time-based research completion. Completion timestamp is independent of
    // tick cadence and uses the shared research-speed calculation.
    const empireByOwner = {};
    for (const e of empires) empireByOwner[e.created_by_id] = e;

    const researching = await base44.asServiceRole.entities.TechProgress.filter(
      { status: 'researching' }, '-created_date', 5000
    );
    let advanced = 0;
    let completed = 0;
    for (const tp of researching) {
      const owner = tp.created_by_id;
      const doneSet = completedByOwner[owner] || new Set();
      const empire = empireByOwner[owner];
      const level = empire?.research_speed_level || 0;
      const bonus = totalResearchSpeedBonus(doneSet, level);
      const startMs = tp.start_date
        ? new Date(tp.start_date).getTime()
        : (tp.created_date ? new Date(tp.created_date).getTime() : now);
      const completionMs = computeCompletionMs(startMs, tp.research_turns, bonus);
      if (now >= completionMs) {
        await base44.asServiceRole.entities.TechProgress.update(tp.id, {
          status: 'completed', progress: tp.research_turns || 1,
        });
        (completedByOwner[owner] ||= new Set()).add(tp.tech_id);
        completed += 1;
      } else {
        advanced += 1;
      }
    }

    const allUnits = await base44.asServiceRole.entities.Unit.list('-created_date', 5000);
    const buildsCompleted = await processBuildCompletions(base44.asServiceRole, allUnits, now);

    return Response.json({ ok: true, ticked, granted, vrindGranted, advanced, completed, buildsCompleted, at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}