import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { cyclesDue } from '../../shared/tickMath.ts';

// Owner-callable, idempotent production tick. Triggered by the client when
// the production-cycle countdown rolls over. Grants any owed cycles
// (floor((now − last_tick_date) / cycle)) to the caller's empire, recenters
// last_tick_date, and returns the updated empire. No-op when no cycle is due,
// so it cannot double-count with the scheduled tickResources.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'No empire found' }, { status: 404 });

    const now = Date.now();
    const due = cyclesDue(empire.last_tick_date, now);
    if (due <= 0) {
      return Response.json({ empire, granted: 0 });
    }

    const tickedAt = new Date(now).toISOString();
    await base44.entities.Empire.update(empire.id, {
      aetherium_crystal: (empire.aetherium_crystal || 0) + due,
      ferrite_titanium: (empire.ferrite_titanium || 0) + due,
      energy: (empire.energy || 0) + due,
      vrind: (empire.vrind || 0) + due,
      last_tick_date: tickedAt,
    });

    const fresh = await base44.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, granted: due });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}