// Space-combat strength + survivor calculations — shared single source of
// truth for processFleets. Reuses the existing Planet Defense Rating
// (base + orbital defense structures + garrison) as the planetary component
// of the defender's space strength, then adds the defender's stationed
// warships. Attacker strength is computed from the deployed ship_manifest.
//
// Only existing stats and upgrades are used.
//   • Ship offense  = baseStats.attack × per-type upgrade multiplier
//   • Ship survival = baseStats.defense + shielding + hull_armor (durability)

import { getUnit } from './units.ts';
import { unitStatMultipliers } from './unitUpgrades.ts';
import { getEmpireUpgrade } from './empireUpgrades.ts';
import { computePlanetDefenseRating } from './planetDefense.ts';

export function empireUpgradeBonus(empireUpgradeLevels, upgradeId) {
  const upgrade = getEmpireUpgrade(upgradeId);
  const lvl = (empireUpgradeLevels || {})[upgradeId] || 0;
  if (lvl <= 0 || !upgrade) return 0;
  return typeof upgrade.bonus === 'number' ? upgrade.bonus : 0;
}

function isWarship(unit) {
  return !!unit && unit.category !== 'ground' && unit.category !== 'defense' && unit.category !== 'transport';
}

function shipDurability(unit, mul) {
  return (
    (unit.baseStats.defense || 0) * (mul.defense || 1) +
    (unit.baseStats.shielding || 0) * (mul.shielding || 1) +
    (unit.baseStats.hull_armor || 0) * (mul.hull_armor || 1)
  );
}

export function computeAttackerSpaceStrength(shipManifest, upgradeLevelsByType, attackerEmpire) {
  let str = 0;
  for (const [unitType, count] of Object.entries(shipManifest || {})) {
    if (!count) continue;
    const unit = getUnit(unitType);
    if (!unit || !isWarship(unit)) continue;
    const mul = unitStatMultipliers(unitType, (upgradeLevelsByType || {})[unitType] || {});
    str += count * (unit.baseStats.attack || 0) * (mul.attack || 1);
  }
  return Math.round(str);
}

export function computeDefenderSpaceStrength(defenderEmpire, defenderUnitRecords) {
  let pdr = computePlanetDefenseRating(defenderEmpire, defenderUnitRecords);

  // Empire Defense Control Matrix I applies its approved +10% bonus to all
  // defensive numbers represented by the planetary defense rating. It is
  // applied here rather than inside planetDefense.ts so the shared PDR display
  // remains a raw defense breakdown while combat receives the empire-wide
  // modifier.
  const defenseBonus = empireUpgradeBonus(
    defenderEmpire?.empire_upgrade_levels,
    'empire_defense_control_matrix_i'
  );
  pdr = Math.round(pdr * (1 + defenseBonus));

  let warshipStr = 0;
  for (const rec of defenderUnitRecords || []) {
    if (!rec.owned_count) continue;
    const unit = getUnit(rec.unit_type);
    if (!isWarship(unit)) continue;
    const mul = unitStatMultipliers(rec.unit_type, rec.upgrade_levels || {});
    warshipStr += rec.owned_count * (unit.baseStats.attack || 0) * (mul.attack || 1);
  }
  return Math.round(pdr + warshipStr);
}

export function attackerFleetDefenseBonus(attackerEmpire) {
  return 0;
}

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

export function computeFleetLosses(shipManifest, survivorMap) {
  const losses = {};
  for (const [type, count] of Object.entries(shipManifest || {})) {
    const surv = (survivorMap || {})[type] || 0;
    const lost = Math.max(0, (count || 0) - surv);
    if (lost > 0) losses[type] = lost;
  }
  return losses;
}
