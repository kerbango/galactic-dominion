import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';

// Processes every active fleet whose current phase has elapsed:
//   • outbound arrival  → enter a visible "In Battle" window (status=in_battle)
//     so the engagement plays out on screen instead of resolving instantly.
//   • battle end        → resolve combat, steal loot (on a win), start the
//     return leg back home.
//   • return arrival    → deposit carried loot into the attacker's empire and
//     mark the fleet home (arrived).
// Runs on the Process Fleets workflow schedule so journeys complete even with
// no client watching, and is also invokable by admins for testing.
//
// Combat math is a PLACEHOLDER for now — real strength (fleet size + power +
// upgrades + research + modifiers) and the win/loss formula are tuned later.
const TRAVEL_SECONDS_PER_UNIT = 8;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// --- Battle window -------------------------------------------------------
// A fleet fights for a base 3 minutes plus 1 minute per 1000 ships, capped so
// the largest engagements don't lock a fleet down for too long. This also
// staggers simultaneous arrivals: different fleet sizes finish their battles
// at different times, so the server isn't resolving every event in one tick.
// TODO(upgrades): future "Battle Tactics" upgrades/research will shorten this
// duration. Apply a reduction multiplier here once empire upgrade state is
// available to this function.
const BATTLE_BASE_MS = 3 * 60 * 1000;
const BATTLE_PER_1000_MS = 60 * 1000;
const BATTLE_CAP_MS = 15 * 60 * 1000;
const battleDurationMs = (fleetSize) =>
  Math.min(BATTLE_BASE_MS + Math.floor((fleetSize || 0) / 1000) * BATTLE_PER_1000_MS, BATTLE_CAP_MS);

// --- Placeholder combat tuning -------------------------------------------
const DEFENDER_STRENGTH = 50;        // fixed defender strength until real math
const ATTACKER_POWER_PER_SHIP = 10;  // attacker strength = fleet_size * this
const SURVIVOR_RATE_WIN = 0.7;       // fraction of ships that survive a win
const SURVIVOR_RATE_LOSS = 0.3;      // fraction that survive a loss
const LOOT_RATE = 0.2;               // on a win, steal this fraction of each resource
const RES_KEYS = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind'];

// Resolves combat for a fleet whose battle has ended: computes the win/loss,
// steals loot from the defender on a win, and starts the return leg home.
async function resolveCombatAndReturn(base44, f, byId, now, nowIso) {
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
    status: 'in_transit',
    leg: 'return',
    outcome: win ? 'win' : 'loss',
    survivors,
    loot,
    return_departure_date: nowIso,
    return_arrival_date: returnArrival,
  });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await authorizeTick(base44);
    if (!guard.ok) return guard.response;

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // Fleet reads are open, but updates are owner-only — use service role so
    // every player's fleets advance regardless of who runs the tick. Pull
    // both in_transit and in_battle fleets (in_battle fleets may have their
    // battle window elapsed and need combat resolution).
    const all = await base44.asServiceRole.entities.Fleet.list('-created_date', 1000);
    const fleets = all.filter((f) => f.status === 'in_transit' || f.status === 'in_battle');

    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const byId = new Map(empires.map((e) => [e.id, e]));
    const byOwnerId = new Map(empires.map((e) => [e.created_by_id, e]));

    let enteredBattle = 0;  // outbound arrivals → entered the battle window
    let resolved = 0;       // battle windows ended → combat resolved + return leg started
    let returned = 0;       // return arrivals → loot deposited, fleet home

    for (const f of fleets) {
      if (f.status === 'in_battle') {
        // --- Battle window elapsed: resolve combat, begin the return leg ---
        const battleEndMs = new Date(f.battle_end_date).getTime();
        if (!battleEndMs || battleEndMs > now) continue; // still fighting
        await resolveCombatAndReturn(base44, f, byId, now, nowIso);
        resolved += 1;
        continue;
      }

      // status === 'in_transit'
      const returning = f.leg === 'return';
      const arrivalMs = new Date(returning ? f.return_arrival_date : f.arrival_date).getTime();
      if (!arrivalMs || arrivalMs > now) continue; // still travelling

      if (!returning) {
        // --- Outbound arrival: enter the battle window (or resolve if it
        // already elapsed while waiting for a tick, e.g. a stuck fleet) ---
        const battleEnd = arrivalMs + battleDurationMs(f.fleet_size);
        if (battleEnd > now) {
          await base44.asServiceRole.entities.Fleet.update(f.id, {
            status: 'in_battle',
            battle_end_date: new Date(battleEnd).toISOString(),
          });
          enteredBattle += 1;
        } else {
          await resolveCombatAndReturn(base44, f, byId, now, nowIso);
          resolved += 1;
        }
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

    return Response.json({ ok: true, enteredBattle, resolved, returned, at: nowIso });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}