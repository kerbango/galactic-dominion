import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveScoutRecon } from '../../shared/planetaryIntel.ts';

// Completes a reconnaissance scan: collects intelligence for the scout's
// target system, stores it in PlanetaryIntelligence, and starts the scout's
// return journey. Called by the client when the recon timer elapses, with
// processFleets as a fallback. The scout must be "scouting" and its
// recon_end_date must have passed.
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
    if (fleet.mission_type !== 'scout' || fleet.status !== 'scouting') {
      return Response.json({ error: 'Scout is not scanning.' }, { status: 400 });
    }
    const reconEnd = new Date(fleet.recon_end_date).getTime();
    if (reconEnd > Date.now()) return Response.json({ error: 'Recon still in progress.' }, { status: 400 });

    const empires = await svc.entities.Empire.list('-created_date', 1000);
    const target = empires.find((e) => e.id === fleet.target_empire_id);
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    await resolveScoutRecon(svc, fleet, target, now, nowIso);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}