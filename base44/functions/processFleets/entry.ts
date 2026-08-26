import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Processes every in-transit fleet whose current leg has elapsed:
//   • outbound arrival  → resolve combat, steal loot (on a win), start the
//     return leg back home.
//   • return arrival    → deposit carried loot into the attacker's empire and
//     mark the fleet home (arrived).
// Runs on a schedule (see function.jsonc) so journeys complete even with no
// client watching, and is also invokable by admins for testing.
//
// Combat math is a PLACEHOLDER for now — real strength (fleet size + power +
// upgrades + research + modifiers) and the win/loss formula are tuned later.
const TRAVEL_SECONDS_PER_UNIT = 8;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// --- Placeholder combat tuning -------------------------------------------
const DEFENDER_STRENGTH = 50;        // fixed defender strength until real math
const ATTACKER_POWER_PER_SHIP = 10;  // attacker strength = fleet_size * this
const SURVIVOR_RATE_WIN = 0.7;       // fraction of ships that survive a win
const SURVIVOR_RATE_LOSS = 0.3;      // fraction that survive a loss
const LOOT_RATE = 0.2;               // on a win, steal this fraction of each resource
const RES_KEYS = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // Fleet reads are open, but updates are owner-only — use service role so
    // every player's fleets advance regardless of who runs the tick.
    const fleets = await base44.asServiceRole.entities.Fleet.filter(
      { status: 'in_transit' },
      '-created_date',
      1000
    );

    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const byId = new Map(empires.map((e) => [e.id, e]));
    const byOwnerId = new Map(empires.map((e) => [e.created_by_id, e]));

    let resolved = 0;  // outbound arrivals → combat + return leg started
    let returned = 0;  // return arrivals → loot deposited, fleet home

    for (const f of fleets) {
      const returning = f.leg === 'return';
      const arrivalMs = new Date(returning ? f.return_arrival_date : f.arrival_date).getTime();
      if (!arrivalMs || arrivalMs > now) continue; // still travelling

      if (!returning) {
        // --- Outbound arrival: resolve combat, begin the return leg ---
        const defender = byId.get(f.target_empire_id);
        const attackerStrength = (f.fleet_size || 0) * ATTACKER_POWER_PER_SHIP;
        const win = attackerStrength > DEFENDER_STRENGTH;
        const survivors = Math.max(
          1,
          Math.ceil((f.fleet_size || 1) * (win ? SURVIVOR_RATE_WIN : SURVIVOR_RATE_LOSS))
        );

        let loot = null;
        if (win && defender) {
          loot = {};
          for (const k of RES_KEYS) {
            const avail = Math.max(0, defender[k] || 0);
            loot[k] = Math.floor(avail * LOOT_RATE);
          }
          // Deduct the stolen resources from the defender immediately.
          const inc = {};
          for (const k of RES_KEYS) inc[k] = -(loot[k] || 0);
          await base44.asServiceRole.entities.Empire.updateMany({ id: defender.id }, { $inc: inc });
        }

        const d = dist(f.origin_x, f.origin_y, f.target_x, f.target_y);
        const returnTravelMs = Math.round(d * TRAVEL_SECONDS_PER_UNIT) * 1000;
        const returnArrival = new Date(now + returnTravelMs).toISOString();

        await base44.asServiceRole.entities.Fleet.update(f.id, {
          leg: 'return',
          outcome: win ? 'win' : 'loss',
          survivors,
          loot,
          return_departure_date: nowIso,
          return_arrival_date: returnArrival,
        });
        resolved += 1;
      } else {
        // --- Return arrival: deposit carried loot, mark fleet home ---
        const attacker = byOwnerId.get(f.created_by_id);
        if (f.loot && attacker) {
          const inc = {};
          for (const k of RES_KEYS) inc[k] = f.loot[k] || 0;
          await base44.asServiceRole.entities.Empire.updateMany({ id: attacker.id }, { $inc: inc });
        }
        await base44.asServiceRole.entities.Fleet.update(f.id, { status: 'arrived' });
        returned += 1;
      }
    }

    return Response.json({ ok: true, resolved, returned, at: nowIso });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}