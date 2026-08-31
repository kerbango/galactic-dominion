import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getUnit } from '../../shared/units.ts';

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
    const missionType = body?.mission_type === 'scout' ? 'scout' : 'attack';
    const scoutUnitType = body?.scout_unit_type;
    if (!targetEmpireId) return Response.json({ error: 'target_empire_id is required' }, { status: 400 });
    if (!Number.isFinite(fleetSize) || fleetSize < 1) return Response.json({ error: 'fleet_size must be a positive number' }, { status: 400 });

    // Ground forces manifest: map of ground unit_type → count to deploy.
    const groundForces = body?.ground_forces || {};

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

    let scoutClass = null;
    if (missionType === 'scout') {
      const scoutTypes = { light_scout: 'light', medium_scout: 'medium', heavy_scout: 'heavy' };
      scoutClass = scoutTypes[scoutUnitType];
      if (!scoutClass) return Response.json({ error: 'Select a valid Light, Medium, or Heavy Scout.' }, { status: 400 });
      const records = await base44.asServiceRole.entities.Unit.filter({ created_by_id: user.id, unit_type: scoutUnitType });
      const scout = records[0];
      if (!scout || (scout.owned_count || 0) < 1) return Response.json({ error: `No available ${getUnit(scoutUnitType)?.name || 'scout'}.` }, { status: 400 });
      await base44.asServiceRole.entities.Unit.update(scout.id, { owned_count: scout.owned_count - 1 });
    }

    // ── Ground forces validation & depletion ──────────────────────────
    // Read the attacker's Unit records (service role — Unit RLS is owner-
    // only). We need them to check transport capacity, verify the player
    // owns enough of each ground type, and subtract the deployed counts
    // from the garrison (owned_count) so they leave the planet's defense.
    let groundManifest = {};
    const hasGround = Object.keys(groundForces).length > 0;
    if (hasGround) {
      const svc = base44.asServiceRole;
      const myUnits = await svc.entities.Unit.filter({ created_by_id: user.id });
      const unitMap = {};
      for (const u of myUnits) unitMap[u.unit_type] = u;

      // Transport capacity = troop_transport.owned_count × carryingCapacity.
      const transportRec = unitMap['troop_transport'];
      const transportOwned = transportRec?.owned_count || 0;
      if (transportOwned < 1) {
        return Response.json({ error: 'You need at least one Troop Transport to carry ground forces.' }, { status: 400 });
      }
      const transportUnit = getUnit('troop_transport');
      const totalCapacity = transportOwned * (transportUnit.carryingCapacity || 0);

      // Validate each ground unit entry and total capacity.
      let totalLoaded = 0;
      const validated = {};
      for (const [type, rawCount] of Object.entries(groundForces)) {
        const count = Math.floor(Number(rawCount) || 0);
        if (count <= 0) continue;
        const unit = getUnit(type);
        if (!unit || unit.category !== 'ground') {
          return Response.json({ error: `${type} is not a ground unit.` }, { status: 400 });
        }
        const owned = unitMap[type]?.owned_count || 0;
        if (count > owned) {
          return Response.json({ error: `Not enough ${unit.name} available (${owned} owned, ${count} requested).` }, { status: 400 });
        }
        validated[type] = count;
        totalLoaded += count;
      }

      if (totalLoaded > totalCapacity) {
        return Response.json({ error: `Transport capacity exceeded: ${totalLoaded} units need ${totalLoaded} capacity but you have ${totalCapacity}.` }, { status: 400 });
      }

      // Subtract deployed ground units from the attacker's garrison
      // (owned_count). They are now "at sea" on the fleet manifest and will
      // return home as survivors after combat (or be destroyed).
      for (const [type, count] of Object.entries(validated)) {
        const rec = unitMap[type];
        await svc.entities.Unit.update(rec.id, { owned_count: (rec.owned_count || 0) - count });
      }
      groundManifest = validated;
    }

    const d = dist(origin.map_x, origin.map_y, target.map_x, target.map_y);
    const travelSeconds = Math.round(d * TRAVEL_SECONDS_PER_UNIT);
    const now = new Date();
    const arrival = new Date(now.getTime() + travelSeconds * 1000);

    const fleet = await base44.entities.Fleet.create({
      target_empire_id: target.id,
      target_owner_id: target.created_by_id,
      target_empire_name: target.empire_name,
      origin_empire_name: origin.empire_name,
      origin_x: origin.map_x,
      origin_y: origin.map_y,
      target_x: target.map_x,
      target_y: target.map_y,
      fleet_size: missionType === 'scout' ? 1 : Math.floor(fleetSize),
      mission_type: missionType,
      scout_class: scoutClass,
      scout_unit_type: missionType === 'scout' ? scoutUnitType : null,
      status: 'in_transit',
      leg: 'outbound',
      departure_date: now.toISOString(),
      arrival_date: arrival.toISOString(),
      ground_forces: groundManifest,
    });

    return Response.json({ fleet });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}