import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';
import { cyclesDue, martialLawMultiplier } from '../../shared/tickMath.ts';
import { advanceResearch } from '../../shared/researchTick.ts';
import { processBuildCompletions } from '../../shared/buildCompletion.ts';
import { economyProductionRates } from '../../shared/economyProduction.ts';

const VRIND_INCOME_UPGRADE_IDS = ['income_upgrade_i', 'income_upgrade_ii', 'income_upgrade_iii', 'tax_office_i', 'tax_office_ii', 'tax_office_iii'];
function recurringVrindMultiplier(empire) {
  const levels = empire?.empire_upgrade_levels || {};
  const bonuses = { income_upgrade_i: 0.05, income_upgrade_ii: 0.05, income_upgrade_iii: 0.05, tax_office_i: 0.05, tax_office_ii: 0.10, tax_office_iii: 0.15 };
  return 1 + VRIND_INCOME_UPGRADE_IDS.reduce((sum, id) => sum + (levels[id] > 0 ? bonuses[id] : 0), 0);
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
    let ticked = 0, granted = 0, vrindGranted = 0, researchInvested = 0, researchCompleted = 0;

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
      const inc = {
        ferrite_titanium: ferriteGrant,
        energy: energyGrant,
        vrind: vrindGrant,
        berentium: berentiumGrant,
      };
      if (aetheriumGrant > 0) inc.aetherium_crystal = aetheriumGrant;
      await base44.asServiceRole.entities.Empire.updateMany({ id: empire.id }, { $inc: inc, $set: { last_tick_date: tickedAt } });
      ticked += 1;
      granted += ferriteGrant + energyGrant + berentiumGrant + aetheriumGrant;
      vrindGranted += vrindGrant;
    }

    const empireByOwner = {};
    for (const e of empires) empireByOwner[e.created_by_id] = e;
    const researching = await base44.asServiceRole.entities.TechProgress.filter({ status: 'researching' }, '-created_date', 5000);
    const byOwner = {};
    for (const tp of researching) (byOwner[tp.created_by_id] ||= []).push(tp);

    for (const [owner, records] of Object.entries(byOwner)) {
      const empire = empireByOwner[owner];
      if (!empire) continue;
      const due = cyclesDue(empire.last_tick_date, now);
      if (due <= 0) continue;
      const doneSet = completedByOwner[owner] || new Set();
      const result = await advanceResearch(base44.asServiceRole, empire, due, doneSet, records);
      researchInvested += result.invested;
      if (result.completed) {
        (completedByOwner[owner] ||= new Set()).add(result.techId);
        researchCompleted += result.completed;
      }
    }

    const allUnits = await base44.asServiceRole.entities.Unit.list('-created_date', 5000);
    const buildsCompleted = await processBuildCompletions(base44.asServiceRole, allUnits, now);
    return Response.json({ ok: true, ticked, granted, vrindGranted, researchInvested, researchCompleted, buildsCompleted, at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}