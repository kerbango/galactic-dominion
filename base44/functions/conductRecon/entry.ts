import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { RECON_DURATION, SCOUT_UNITS } from '../../shared/planetaryIntel.ts';

// Starts a reconnaissance scan for a scout that has arrived at its target.
// The scout must be in "awaiting_recon" status. Sets it to "scouting" with a
// recon_end_date; the actual intel collection happens when the scan completes
// (via completeRecon, or the processFleets fallback tick).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fleet_id } = await req.json().catch(() => ({}));
    if (!fleet_id) return Response.json({ error: 'fleet_id is required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const fleet = await svc.entities.Fleet.get(fleet_id);
    if (!fleet) return Response.json({ error: 'Fleet not found.' }, { status: 404 });
    if (fleet.created_by_id !== user.id) return Response.json({ error: 'Not your fleet.' }, { status: 403 });
    if (fleet.mission_type !== 'scout') return Response.json({ error: 'Not a scout mission.' }, { status: 400 });
    if (fleet.status !== 'awaiting_recon') return Response.json({ error: 'Scout is not ready for recon.' }, { status: 400 });

    const duration = RECON_DURATION[fleet.scout_class] || 15;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const endIso = new Date(now + duration * 1000).toISOString();

    // Update as the user (not service role) so the realtime subscription fires
    // and the client sees the status transition immediately.
    await base44.entities.Fleet.update(fleet_id, {
      status: 'scouting',
      recon_start_date: nowIso,
      recon_end_date: endIso,
    });

    return Response.json({ ok: true, recon_end_date: endIso, duration });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}