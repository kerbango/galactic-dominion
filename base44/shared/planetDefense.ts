// Planet Defense Rating computation — shared by the frontend (Console
// display) and the backend (processFleets ground-combat Phase 1). The rating
// combines a flat base, defensive-structure contributions, and a garrison
// ground-troop armor contribution. Per-type upgrade multipliers are applied
// so purchased upgrades meaningfully raise the rating.

import { getUnit } from './units.ts';
import { unitStatMultipliers } from './unitUpgrades.ts';

// Flat base every empire gets so an undefended planet still has some
// resistance. Empire upgrade levels (empire_upgrade_levels) can add more
// once defense-oriented empire upgrades exist.
const BASE_RATING = 50;

// Fraction of a garrisoned ground unit's armor that counts toward the
// planet defense rating (troops in foxholes are less effective per-point
// than a purpose-built bunker).
const GARRISON_ARMOR_FACTOR = 0.5;

export function computePlanetDefenseRating(empire, unitRecords) {
  let rating = BASE_RATING;

  for (const rec of unitRecords || []) {
    const unit = getUnit(rec.unit_type);
    if (!unit || !rec.owned_count) continue;
    const mul = unitStatMultipliers(rec.unit_type, rec.upgrade_levels || {});
    if (unit.category === 'defense') {
      rating += rec.owned_count * (unit.baseStats.defense_rating || 0) * (mul.defense_rating || 1);
    } else if (unit.category === 'ground') {
      rating += rec.owned_count * (unit.baseStats.armor || 0) * GARRISON_ARMOR_FACTOR * (mul.armor || 1);
    }
  }

  return Math.round(rating);
}

// Ground assault strength of a deployed manifest. Each ground unit
// contributes its (attack + armor) × count, scaled by per-type upgrade
// multipliers. `upgradeLevelsByType` is { unit_type: { upgrade_id: level } }.
export function computeGroundStrength(groundForces, upgradeLevelsByType) {
  let strength = 0;
  for (const [unitType, count] of Object.entries(groundForces || {})) {
    const unit = getUnit(unitType);
    if (!unit || unit.category !== 'ground') continue;
    const mul = unitStatMultipliers(unitType, (upgradeLevelsByType || {})[unitType] || {});
    const attack = (unit.baseStats.attack || 0) * (mul.attack || 1);
    const armor = (unit.baseStats.armor || 0) * (mul.armor || 1);
    strength += count * (attack + armor);
  }
  return Math.round(strength);
}

// Garrison ground strength for a defender — same formula but computed from
// the defender's owned ground-unit Unit records (not a deployed manifest).
export function computeGarrisonStrength(unitRecords) {
  let strength = 0;
  for (const rec of unitRecords || []) {
    const unit = getUnit(rec.unit_type);
    if (!unit || unit.category !== 'ground' || !rec.owned_count) continue;
    const mul = unitStatMultipliers(rec.unit_type, rec.upgrade_levels || {});
    const attack = (unit.baseStats.attack || 0) * (mul.attack || 1);
    const armor = (unit.baseStats.armor || 0) * (mul.armor || 1);
    strength += rec.owned_count * (attack + armor);
  }
  return Math.round(strength);
}