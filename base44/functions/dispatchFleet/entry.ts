import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Must match src/lib/galaxy.js TRAVEL_SECONDS_PER_UNIT — travel time is
// computed server-side from the grid distance so the arrival timestamp the
// client stores is authoritative and can't be tampered with from the UI.
const TRAVEL_SECONDS_PER_UNIT = 8;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetEmpireId = body?.target_empire_id;
    const fleetSize = Number(body?.fleet_size);
    if (!targetEmpireId) return Response.json({ error: 'target_empire_id is required' }, { status: 400 });
    if (!Number.isFinite(fleetSize) || fleetSize < 1) return Response.json({ error: 'fleet_size must be a positive number' }, { status: 400 });

    // Empire RLS is owner-only, so read as service role to access both the
    // player's own empire and the target's coordinates.
    const all = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const origin = all.find((e) => e.created_by_id === user.id);
    if (!origin) return Response.json({ error: 'You have no empire to dispatch from.' }, { status: 400 });
    if (origin.map_x == null || origin.map_y == null) return Response.json({ error: 'Your empire has no coordinates.' }, { status: 400 });

    const target = all.find((e) => e.id === targetEmpireId);
    if (!target) return Response.json({ error: 'Target empire not found.' }, { status: 404 });
    if (target.map_x == null || target.map_y == null) return Response.json({ error: 'Target empire has no coordinates.' }, { status: 400 });
    if (target.id === origin.id) return Response.json({ error: 'Cannot dispatch a fleet to your own empire.' }, { status: 400 });

    const d = dist(origin.map_x, origin.map_y, target.map_x, target.map_y);
    const travelSeconds = Math.round(d * TRAVEL_SECONDS_PER_UNIT);
    const now = new Date();
    const arrival = new Date(now.getTime() + travelSeconds * 1000);

    const fleet = await base44.entities.Fleet.create({
      target_empire_id: target.id,
      target_empire_name: target.empire_name,
      origin_empire_name: origin.empire_name,
      origin_x: origin.map_x,
      origin_y: origin.map_y,
      target_x: target.map_x,
      target_y: target.map_y,
      fleet_size: Math.floor(fleetSize),
      status: 'in_transit',
      leg: 'outbound',
      departure_date: now.toISOString(),
      arrival_date: arrival.toISOString(),
    });

    return Response.json({ fleet });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}