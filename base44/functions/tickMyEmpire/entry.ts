import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { cyclesDue, martialLawMultiplier } from '../../shared/tickMath.ts';
import { advanceResearch } from '../../shared/researchTick.ts';
import { processBuildCompletions } from '../../shared/buildCompletion.ts';

// Owner-callable, idempotent production tick. Triggered by the client when
// the production-cycle countdown rolls over. Grants any owed cycles
// (floor((now − last_tick_date) / cycle)) to the caller's empire, recenters
// last_tick_date, and advances the empire's active research by the same
// elapsed cycles. No-op when no cycle is due, so it cannot double-count with
// the scheduled tickResources.
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
      const grant = due * martialLawMultiplier(empire, now);
      const tickedAt = new Date(now).toISOString();
      await base44.entities.Empire.update(empire.id, {
        aetherium_crystal: (empire.aetherium_crystal || 0) + grant,
        ferrite_titanium: (empire.ferrite_titanium || 0) + grant,
        energy: (empire.energy || 0) + grant,
        vrind: (empire.vrind || 0) + grant,
        berentium: (empire.berentium || 0) + grant,
        last_tick_date: tickedAt,
      });
      granted = grant;

      // Advance the empire's active research by the elapsed cycles. Research
      // output is generated per hour from population + speed bonuses and
      // applied directly to the oldest in-progress technology.
      const [myCompleted, myResearching] = await Promise.all([
        svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'completed' }),
        svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'researching' }),
      ]);
      const completedSet = new Set(myCompleted.map((r) => r.tech_id));
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