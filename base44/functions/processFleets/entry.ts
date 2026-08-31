import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';
import { getUnit } from '../../shared/units.ts';
import { computePlanetDefenseRating, computeGroundStrength, computeGarrisonStrength } from '../../shared/planetDefense.ts';
import { collectSystemIntel, INTEL_RANK, resolveScoutRecon } from '../../shared/planetaryIntel.ts';

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
// TEMPORARY TESTING OVERRIDE: scout return legs use the same accelerated speed
// as the outbound scout dispatch so round-trips complete in seconds. Attack
// fleets keep the normal pacing. Revert when testing is done.
const SCOUT_TRAVEL_SECONDS_PER_UNIT = 0.5;
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
const GROUND_LOOT_RATE = 0.15;       // additional plunder when ground forces win
const RES_KEYS = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind'];

// Resolves combat for a fleet whose battle has ended: computes the space
// combat win/loss, steals loot from the defender on a win, then — if ground
// forces are present and the space battle was won — resolves the sequential
// two-phase ground assault (Planet Defense Rating, then garrison troops),
// and starts the return leg home.
async function resolveCombatAndReturn(base44, f, byId, now, nowIso) {
  const svc = base44.asServiceRole;
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
    await svc.entities.Empire.updateMany({ id: defender.id }, { $inc: inc });
  }

  // ── Ground combat (only on a space win with ground forces aboard) ──
  let groundOutcome = null;
  let groundSurvivors = {};
  const groundForces = f.ground_forces || {};
  if (win && defender && Object.keys(groundForces).length > 0) {
    // Read attacker's Unit records for per-type upgrade levels.
    const attackerUnits = await svc.entities.Unit.filter({ created_by_id: f.created_by_id });
    const attackerUpgrades = {};
    for (const u of attackerUnits) attackerUpgrades[u.unit_type] = u.upgrade_levels || {};

    // Read defender's Unit records for PDR + garrison strength.
    const defenderUnits = await svc.entities.Unit.filter({ created_by_id: defender.created_by_id });

    // Phase 1 — attacker ground strength vs Planet Defense Rating.
    const attackerGroundStr = computeGroundStrength(groundForces, attackerUpgrades);
    const pdr = computePlanetDefenseRating(defender, defenderUnits);

    if (attackerGroundStr > pdr) {
      // Phase 1 won: compute surviving attacker ground forces (some losses
      // from breaching the defenses).
      const phase1Rate = Math.min(0.9, 0.5 + 0.4 * (1 - pdr / Math.max(1, attackerGroundStr)));
      const phase1Surv = {};
      for (const [type, count] of Object.entries(groundForces)) {
        const s = Math.max(1, Math.floor(count * phase1Rate));
        if (s > 0) phase1Surv[type] = s;
      }

      // Phase 2 — surviving attacker vs defender's garrisoned ground troops.
      const garrisonStr = computeGarrisonStrength(defenderUnits);
      const attackerSurvStr = computeGroundStrength(phase1Surv, attackerUpgrades);

      if (attackerSurvStr > garrisonStr) {
        // Attacker wins Phase 2: destroy defender ground units + some
        // defensive structures, ground survivors return with bonus loot.
        for (const u of defenderUnits) {
          const unit = getUnit(u.unit_type);
          if (unit?.category === 'ground' && u.owned_count > 0) {
            await svc.entities.Unit.update(u.id, { owned_count: 0 });
          }
        }
        const structLossRate = Math.min(0.8, 0.3 + 0.5 * (1 - garrisonStr / Math.max(1, attackerSurvStr)));
        for (const u of defenderUnits) {
          const unit = getUnit(u.unit_type);
          if (unit?.category === 'defense' && u.owned_count > 0) {
            const destroyed = Math.floor(u.owned_count * structLossRate);
            if (destroyed > 0) {
              await svc.entities.Unit.update(u.id, { owned_count: u.owned_count - destroyed });
            }
          }
        }
        const phase2Rate = Math.min(0.85, 0.5 + 0.35 * (1 - garrisonStr / Math.max(1, attackerSurvStr)));
        for (const [type, count] of Object.entries(phase1Surv)) {
          const s = Math.max(1, Math.floor(count * phase2Rate));
          if (s > 0) groundSurvivors[type] = s;
        }
        groundOutcome = 'win';

        // Extend loot: ground forces plunder additional resources.
        if (loot) {
          const bonus = {};
          const inc = {};
          for (const k of RES_KEYS) {
            const avail = Math.max(0, defender[k] || 0);
            bonus[k] = Math.floor(avail * GROUND_LOOT_RATE);
            loot[k] = (loot[k] || 0) + bonus[k];
            inc[k] = -(bonus[k] || 0);
          }
          await svc.entities.Empire.updateMany({ id: defender.id }, { $inc: inc });
        }
      } else {
        // Defender garrison wins: attacker ground forces destroyed.
        groundOutcome = 'loss';
      }
    } else {
      // Phase 1 lost: partial ground survivors retreat.
      const ratio = attackerGroundStr / Math.max(1, pdr);
      const retRate = Math.max(0.1, ratio * 0.5);
      for (const [type, count] of Object.entries(groundForces)) {
        const s = Math.floor(count * retRate);
        if (s > 0) groundSurvivors[type] = s;
      }
      groundOutcome = 'loss';
    }
  }

  const d = dist(f.origin_x, f.origin_y, f.target_x, f.target_y);
  const returnTravelMs = Math.round(d * TRAVEL_SECONDS_PER_UNIT) * 1000;
  const returnArrival = new Date(now + returnTravelMs).toISOString();

  await svc.entities.Fleet.update(f.id, {
    status: 'in_transit',
    leg: 'return',
    outcome: win ? 'win' : 'loss',
    survivors,
    loot,
    ground_outcome: groundOutcome,
    ground_survivors: groundSurvivors,
    return_departure_date: nowIso,
    return_arrival_date: returnArrival,
  });
}

async function completeScoutAndReturn(base44, fleet, target, now, nowIso) {
  const svc = base44.asServiceRole;
  await resolveScoutRecon(svc, fleet, target, now, nowIso);
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
    const fleets = all.filter((f) => f.status === 'in_transit' || f.status === 'in_battle' || f.status === 'scouting');

    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const byId = new Map(empires.map((e) => [e.id, e]));
    const byOwnerId = new Map(empires.map((e) => [e.created_by_id, e]));

    let enteredBattle = 0;  // outbound arrivals → entered the battle window
    let scouted = 0;        // scout arrivals → intelligence stored + return started
    let resolved = 0;       // battle windows ended → combat resolved + return leg started
    let returned = 0;       // return arrivals → loot deposited, fleet home

    for (const f of fleets) {
      if (f.status === 'scouting') {
        // --- Scouting fleet: if recon timer elapsed, collect intel + return ---
        const reconEnd = new Date(f.recon_end_date).getTime();
        if (!reconEnd || reconEnd > now) continue; // still scanning
        await completeScoutAndReturn(base44, f, byId.get(f.target_empire_id), now, nowIso);
        scouted += 1;
        continue;
      }
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
        if (f.mission_type === 'scout') {
          // --- Scout arrives: hold at target, awaiting player-initiated recon ---
          await base44.asServiceRole.entities.Fleet.update(f.id, { status: 'awaiting_recon' });
          continue;
        }
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
        // --- Return arrival: deposit carried loot, return ground survivors, mark fleet home ---
        const attacker = byOwnerId.get(f.created_by_id);
        if (f.mission_type === 'scout' && f.scout_unit_type) {
          const scouts = await base44.asServiceRole.entities.Unit.filter({ created_by_id: f.created_by_id, unit_type: f.scout_unit_type });
          if (scouts[0]) await base44.asServiceRole.entities.Unit.update(scouts[0].id, { owned_count: (scouts[0].owned_count || 0) + 1 });
          await base44.asServiceRole.entities.Fleet.update(f.id, { status: 'arrived' });
          returned += 1;
          continue;
        }
        if (f.loot && attacker) {
          const inc = {};
          for (const k of RES_KEYS) inc[k] = f.loot[k] || 0;
          await base44.asServiceRole.entities.Empire.updateMany({ id: attacker.id }, { $inc: inc });
        }
        // Return surviving ground forces to the attacker's garrison. The
        // deployed counts were subtracted at dispatch time; survivors come
        // back home and rejoin the planet defense pool.
        const groundSurv = f.ground_survivors || {};
        if (attacker && Object.keys(groundSurv).length > 0) {
          const attackerUnits = await base44.asServiceRole.entities.Unit.filter({ created_by_id: f.created_by_id });
          const unitMap = {};
          for (const u of attackerUnits) unitMap[u.unit_type] = u;
          for (const [type, count] of Object.entries(groundSurv)) {
            const rec = unitMap[type];
            if (rec) {
              await base44.asServiceRole.entities.Unit.update(rec.id, {
                owned_count: (rec.owned_count || 0) + count,
              });
            }
          }
        }
        await base44.asServiceRole.entities.Fleet.update(f.id, { status: 'arrived' });
        returned += 1;
      }
    }

    return Response.json({ ok: true, enteredBattle, scouted, resolved, returned, at: nowIso });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}