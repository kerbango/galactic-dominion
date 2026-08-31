// Space-combat strength + survivor calculations — shared single source of
// truth for processFleets. Reuses the existing Planet Defense Rating
// (base + orbital defense structures + garrison) as the planetary component
// of the defender's space strength, then adds the defender's stationed
// warships. Attacker strength is computed from the deployed ship_manifest.
//
// Only existing stats and upgrades are used — no invented values.
//   • Ship offense  = baseStats.attack × per-type upgrade multiplier
//   • Ship survival = baseStats.defense + shielding + hull_armor (durability)
//   • Empire upgrades: plasma_efficiency (Fleet Attack), reinforced_hull_ii +
//     heavy_armor (Fleet Defense → attacker survivability)
// Research unlocks these upgrades via the tech tree; no separate research
// combat modifier exists in the current tech data, so none is applied here.

import { getUnit } from './units.ts';
import { unitStatMultipliers } from './unitUpgrades.ts';
import { getEmpireUpgrade } from './empireUpgrades.ts';
import { computePlanetDefenseRating } from './planetDefense.ts';

// Reads the purchased tier bonus for an empire upgrade from the empire's
// empire_upgrade_levels map. Returns 0 when not purchased or maxed-beyond.
export function empireUpgradeBonus(empireUpgradeLevels, upgradeId) {
  const upgrade = getEmpireUpgrade(upgradeId);
  const lvl = (empireUpgradeLevels || {})[upgradeId] || 0;
  if (lvl <= 0 || !upgrade) return 0;
  const tier = upgrade.tiers[lvl - 1];
  return tier ? tier.bonus : 0;
}

// A ship is a space-combat vessel when it is not a ground force, defensive
// structure, or transport. (All warship entries in units.ts carry no category.)
function isWarship(unit) {
  return !!unit && unit.category !== 'ground' && unit.category !== 'defense' && unit.category !== 'transport';
}

// Per-ship durability — the survivability weight used when allocating losses.
// Durable hulls (defense + shielding + hull_armor) absorb losses before
// fragile hulls, so a rare capital ship is not silently rounded to zero.
function shipDurability(unit, mul) {
  return (
    (unit.baseStats.defense || 0) * (mul.defense || 1) +
    (unit.baseStats.shielding || 0) * (mul.shielding || 1) +
    (unit.baseStats.hull_armor || 0) * (mul.hull_armor || 1)
  );
}

// Attacker space-combat strength from the deployed ship_manifest. Each
// warship contributes its attack stat × count × per-type attack upgrade.
// The plasma_efficiency empire upgrade (Fleet Attack) boosts the total.
export function computeAttackerSpaceStrength(shipManifest, upgradeLevelsByType, attackerEmpire) {
  let str = 0;
  for (const [unitType, count] of Object.entries(shipManifest || {})) {
    if (!count) continue;
    const unit = getUnit(unitType);
    if (!unit || !isWarship(unit)) continue;
    const mul = unitStatMultipliers(unitType, (upgradeLevelsByType || {})[unitType] || {});
    str += count * (unit.baseStats.attack || 0) * (mul.attack || 1);
  }
  const plasma = empireUpgradeBonus(attackerEmpire?.empire_upgrade_levels, 'plasma_efficiency');
  return Math.round(str * (1 + plasma));
}

// Defender space-combat strength = Planet Defense Rating (base + orbital
// defense structures + garrison ground troops) + stationed warship firepower.
// Reuses computePlanetDefenseRating so there is a single planetary defense
// calculation. Defender warship attack is boosted by their plasma_efficiency.
export function computeDefenderSpaceStrength(defenderEmpire, defenderUnitRecords) {
  const pdr = computePlanetDefenseRating(defenderEmpire, defenderUnitRecords);
  let warshipStr = 0;
  for (const rec of defenderUnitRecords || []) {
    if (!rec.owned_count) continue;
    const unit = getUnit(rec.unit_type);
    if (!isWarship(unit)) continue;
    const mul = unitStatMultipliers(rec.unit_type, rec.upgrade_levels || {});
    warshipStr += rec.owned_count * (unit.baseStats.attack || 0) * (mul.attack || 1);
  }
  const plasma = empireUpgradeBonus(defenderEmpire?.empire_upgrade_levels, 'plasma_efficiency');
  return Math.round(pdr + warshipStr * (1 + plasma));
}

// Attacker fleet-defense empire upgrade bonus (reinforced_hull_ii +
// heavy_armor). Both are "Fleet Defense" and stack additively onto the
// base survivor rate, improving the attacker's ship survivability.
export function attackerFleetDefenseBonus(attackerEmpire) {
  return (
    empireUpgradeBonus(attackerEmpire?.empire_upgrade_levels, 'reinforced_hull_ii') +
    empireUpgradeBonus(attackerEmpire?.empire_upgrade_levels, 'heavy_armor')
  );
}

// Deterministic, durability-weighted survivor allocation. Given the deployed
// manifest and a total survivor count, returns { unitType: survivorCount }
// with losses taken from the LEAST durable types first — so a rare capital
// ship (e.g. one Dreadnought) survives before fragile escorts are preserved.
// The returned map only contains types with at least one survivor.
export function allocateFleetSurvivors(shipManifest, upgradeLevelsByType, survivorCount) {
  const entries = Object.entries(shipManifest || {})
    .filter(([, n]) => n > 0)
    .map(([type, count]) => {
      const unit = getUnit(type);
      const mul = unit ? unitStatMultipliers(type, (upgradeLevelsByType || {})[type] || {}) : {};
      const dur = unit ? shipDurability(unit, mul) : 0;
      return { type, count, dur };
    });
  const total = entries.reduce((s, e) => s + e.count, 0);
  if (total <= 0) return {};
  const sc = Math.max(0, Math.min(survivorCount, total));
  const toLose = total - sc;
  const survivors = {};
  for (const e of entries) survivors[e.type] = e.count;
  if (toLose > 0) {
    // Least durable first.
    const sorted = [...entries].sort((a, b) => a.dur - b.dur);
    let remaining = toLose;
    for (const e of sorted) {
      if (remaining <= 0) break;
      const lose = Math.min(e.count, remaining);
      survivors[e.type] -= lose;
      remaining -= lose;
    }
  }
  for (const k of Object.keys(survivors)) if (survivors[k] <= 0) delete survivors[k];
  return survivors;
}

// Per-type losses derived from the manifest and the allocated survivors.
// { unitType: lostCount } — stored on the Fleet record so the return leg can
// restore the exact surviving counts and CombatLog can later display losses
// by type without re-deriving them.
export function computeFleetLosses(shipManifest, survivorMap) {
  const losses = {};
  for (const [type, count] of Object.entries(shipManifest || {})) {
    const surv = (survivorMap || {})[type] || 0;
    const lost = Math.max(0, (count || 0) - surv);
    if (lost > 0) losses[type] = lost;
  }
  return losses;
}