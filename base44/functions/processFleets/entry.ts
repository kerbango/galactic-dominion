import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';
import { getUnit } from '../../shared/unitsRuntime.ts';
import { computePlanetDefenseRating, computeGroundStrength, computeGarrisonStrength } from '../../shared/planetDefense.ts';
import { collectSystemIntel, INTEL_RANK, resolveScoutRecon } from '../../shared/planetaryIntel.ts';
import {
  computeAttackerSpaceStrength,
  computeDefenderSpaceStrength,
  attackerFleetDefenseBonus,
  allocateFleetSurvivors,
  computeFleetLosses,
} from '../../shared/spaceCombat.ts';

// Processes every active fleet whose current phase has elapsed:
//   • outbound arrival  → enter a visible "In Battle" window (status=in_battle)
//   • battle end        → resolve combat, steal loot (on a win), start the return leg
//   • return arrival    → deposit carried loot and mark the fleet home
// Runs on the Process Fleets workflow schedule and can be invoked by admins for testing.
// Combat math remains a tuning surface; the unit catalog is the runtime source so
// restricted ships use the same definitions as build-time gating.
const TRAVEL_SECONDS_PER_UNIT = 8;
const SCOUT_TRAVEL_SECONDS_PER_UNIT = 0.5;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const BATTLE_BASE_MS = 3 * 60 * 1000;
const BATTLE_PER_1000_MS = 60 * 1000;
const BATTLE_CAP_MS = 15 * 60 * 1000;
const battleDurationMs = (fleetSize) => Math.min(BATTLE_BASE_MS + Math.floor((fleetSize || 0) / 1000) * BATTLE_PER_1000_MS, BATTLE_CAP_MS);

const LEGACY_ATTACKER_POWER_PER_SHIP = 10;
const SURVIVOR_RATE_WIN = 0.7;
const SURVIVOR_RATE_LOSS = 0.3;
const SURVIVOR_RATE_CAP = 0.95;
const LOOT_RATE = 0.2;
const GROUND_LOOT_RATE = 0.15;
const RES_KEYS = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind'];

async function resolveCombatAndReturn(base44, f, byId, byOwnerId, now, nowIso) {
  const svc = base44.asServiceRole;
  const defender = byId.get(f.target_empire_id);
  const attackerEmpire = byOwnerId.get(f.created_by_id);
  const attackerUnits = await svc.entities.Unit.filter({ created_by_id: f.created_by_id });
  const attackerUpgrades = {};
  for (const u of attackerUnits) attackerUpgrades[u.unit_type] = u.upgrade_levels || {};
  const defenderUnits = defender ? await svc.entities.Unit.filter({ created_by_id: defender.created_by_id }) : [];

  const manifest = f.ship_manifest || {};
  const hasManifest = Object.values(manifest).some((n) => n > 0);

  let win;
  let survivors;
  let shipLosses = null;
  let attackerStrength = null;
  let defenderStrength = null;

  if (hasManifest) {
    attackerStrength = computeAttackerSpaceStrength(manifest, attackerUpgrades, attackerEmpire);
    defenderStrength = computeDefenderSpaceStrength(defender, defenderUnits);
    win = attackerStrength > defenderStrength;
    const totalShips = Object.values(manifest).reduce((s, n) => s + (n || 0), 0);
    const defenseBonus = attackerFleetDefenseBonus(attackerEmpire);
    const rate = Math.min(SURVIVOR_RATE_CAP, (win ? SURVIVOR_RATE_WIN : SURVIVOR_RATE_LOSS) + defenseBonus);
    const survivorCount = Math.max(1, Math.round(totalShips * rate));
    const survivorMap = allocateFleetSurvivors(manifest, attackerUpgrades, survivorCount);
    survivors = Object.values(survivorMap).reduce((s, n) => s + n, 0);
    shipLosses = computeFleetLosses(manifest, survivorMap);
  } else {
    attackerStrength = (f.fleet_size || 0) * LEGACY_ATTACKER_POWER_PER_SHIP;
    defenderStrength = defender ? 50 : 0;
    win = attackerStrength > defenderStrength;
    survivors = Math.max(1, Math.ceil((f.fleet_size || 1) * (win ? SURVIVOR_RATE_WIN : SURVIVOR_RATE_LOSS)));
  }

  let loot = null;
  if (win && defender) {
    loot = {};
    for (const k of RES_KEYS) {
      const avail = Math.max(0, defender[k] || 0);
      loot[k] = Math.floor(avail * LOOT_RATE);
    }
    const inc = {};
    for (const k of RES_KEYS) inc[k] = -(loot[k] || 0);
    await svc.entities.Empire.updateMany({ id: defender.id }, { $inc: inc });
  }

  let groundOutcome = null;
  let groundSurvivors = {};
  const groundForces = f.ground_forces || {};
  if (win && defender && Object.keys(groundForces).length > 0) {
    const attackerGroundStr = computeGroundStrength(groundForces, attackerUpgrades);
    const pdr = computePlanetDefenseRating(defender, defenderUnits);

    if (attackerGroundStr > pdr) {
      const phase1Rate = Math.min(0.9, 0.5 + 0.4 * (1 - pdr / Math.max(1, attackerGroundStr)));
      const phase1Surv = {};
      for (const [type, count] of Object.entries(groundForces)) {
        const s = Math.max(1, Math.floor(count * phase1Rate));
        if (s > 0) phase1Surv[type] = s;
      }

      const garrisonStr = computeGarrisonStrength(defenderUnits);
      const attackerSurvStr = computeGroundStrength(phase1Surv, attackerUpgrades);

      if (attackerSurvStr > garrisonStr) {
        for (const u of defenderUnits) {
          const unit = getUnit(u.unit_type);
          if (unit?.category === 'ground' && u.owned_count > 0) await svc.entities.Unit.update(u.id, { owned_count: 0 });
        }
        const structLossRate = Math.min(0.8, 0.3 + 0.5 * (1 - garrisonStr / Math.max(1, attackerSurvStr)));
        for (const u of defenderUnits) {
          const unit = getUnit(u.unit_type);
          if (unit?.category === 'defense' && u.owned_count > 0) {
            const destroyed = Math.floor(u.owned_count * structLossRate);
            if (destroyed > 0) await svc.entities.Unit.update(u.id, { owned_count: u.owned_count - destroyed });
          }
        }
        const phase2Rate = Math.min(0.85, 0.5 + 0.35 * (1 - garrisonStr / Math.max(1, attackerSurvStr)));
        for (const [type, count] of Object.entries(phase1Surv)) {
          const s = Math.max(1, Math.floor(count * phase2Rate));
          if (s > 0) groundSurvivors[type] = s;
        }
        groundOutcome = 'win';
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
        groundOutcome = 'loss';
      }
    } else {
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
  const update = {
    status: 'in_transit', leg: 'return', outcome: win ? 'win' : 'loss', survivors, loot,
    ground_outcome: groundOutcome, ground_survivors: groundSurvivors,
    return_departure_date: nowIso, return_arrival_date: returnArrival,
    attacker_strength: attackerStrength, defender_strength: defenderStrength,
  };
  if (shipLosses) update.ship_losses = shipLosses;
  await svc.entities.Fleet.update(f.id, update);
}
