// Planet Defense Rating computation — shared by the frontend (Console
display) and the backend (processFleets ground-combat Phase 1). The rating
combines a flat base, defensive-structure contributions, and a garrison
ground-troop armor contribution. Per-type upgrade multipliers are applied
so purchased upgrades meaningfully raise the rating.

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
  const b = computePlanetDefenseBreakdown(empire, unitRecords);
  return b.total;
}

// Full breakdown of the Planet Defense Rating by source category. Returns
// the category subtotals, the grand total, and per-unit contributor lists so
// the Military dashboard can show exactly where each point of protection
// comes from (base, defensive structures, garrison troops, research).
export function computePlanetDefenseBreakdown(empire, unitRecords) {
  const base = BASE_RATING;
  let structures = 0;
  let garrison = 0;
  const structureContributors = [];
  const garrisonContributors = [];

  for (const rec of unitRecords || []) {
    const unit = getUnit(rec.unit_type);
    if (!unit || !rec.owned_count) continue;
    const mul = unitStatMultipliers(rec.unit_type, rec.upgrade_levels || {});
    if (unit.category === 'defense') {
      const contrib = rec.owned_count * (unit.baseStats.defense_rating || 0) * (mul.defense_rating || 1);
      structures += contrib;
      structureContributors.push({ id: unit.id, name: unit.name, count: rec.owned_count, contribution: Math.round(contrib) });
    } else if (unit.category === 'ground') {
      const contrib = rec.owned_count * (unit.baseStats.armor || 0) * GARRISON_ARMOR_FACTOR * (mul.armor || 1);
      garrison += contrib;
      garrisonContributors.push({ id: unit.id, name: unit.name, count: rec.owned_count, contribution: Math.round(contrib) });
    }
  }

  // Research/empire-upgrade bonus — placeholder for future defense-oriented
  // empire upgrades. Reads empire_upgrade_levels; currently 0 since no
  // empire upgrade targets planet defense yet.
  const research = 0;

  const total = Math.round(base + structures + garrison + research);
  return {
    base: Math.round(base),
    structures: Math.round(structures),
    garrison: Math.round(garrison),
    research: Math.round(research),
    total,
    structureContributors: structureContributors.sort((a, b) => b.contribution - a.contribution),
    garrisonContributors: garrisonContributors.sort((a, b) => b.contribution - a.contribution),
  };
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
