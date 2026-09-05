import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
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

// Owner-callable, idempotent production tick. Triggered by the client when
// the production-cycle countdown rolls over. Grants any owed cycles
// (floor((now − last_tick_date) / cycle)) to the caller's empire using the
// same tech-gated production rates as the scheduled tickResources — so
// Aetherium Crystal is only produced once tectonic_shaft_mining is researched.
// Recenters last_tick_date and advances active research by the same elapsed
// cycles. No-op when no cycle is due, so it cannot double-count with the
// scheduled tickResources.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'No empire found' }, { status: 404 });

    const now = Date.now();
    const svc = base44.asServiceRole;
    let granted = 0;

    const due = cyclesDue(empire.last_tick_date, now);
    if (due > 0) {
      const [myCompleted, myResearching] = await Promise.all([
        svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'completed' }),
        svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'researching' }),
      ]);
      const completedSet = new Set(myCompleted.map((r) => r.tech_id));

      const martialMultiplier = martialLawMultiplier(empire, now);
      const hours = due / CYCLES_PER_HOUR;
      const rates = economyProductionRates(completedSet, empire.empire_upgrade_levels || {});
      const ferriteGrant = hours * rates.ferrite * martialMultiplier;
      const energyGrant = hours * rates.energy * martialMultiplier;
      const berentiumGrant = hours * rates.berentium * martialMultiplier;
      const aetheriumGrant = hours * rates.aetherium * martialMultiplier;
      const vrindGrant = due * martialMultiplier * recurringVrindMultiplier(empire);
      const tickedAt = new Date(now).toISOString();

      const inc = {
        ferrite_titanium: ferriteGrant,
        energy: energyGrant,
        vrind: vrindGrant,
        berentium: berentiumGrant,
      };
      if (aetheriumGrant > 0) inc.aetherium_crystal = aetheriumGrant;
      await base44.entities.Empire.update(empire.id, {
        ...Object.fromEntries(Object.entries(inc).map(([k, v]) => [k, (empire[k] || 0) + v])),
        last_tick_date: tickedAt,
      });
      granted = ferriteGrant + energyGrant + berentiumGrant + aetheriumGrant;

      await advanceResearch(svc, empire, due, completedSet, myResearching);
    }

    // Finalize any due ship constructions for this player (time-based,
    // independent of the resource cycle). Unit RLS is owner-only so use the
    // service role to read the player's records.
    const myUnits = await svc.entities.Unit.filter({ created_by_id: user.id });
    const buildsCompleted = await processBuildCompletions(svc, myUnits, now);

    const fresh = await base44.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, granted, buildsCompleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}