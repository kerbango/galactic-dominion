// Planet Defense Rating computation — shared by the frontend (Console
display) and the backend (processFleets ground-combat Phase 1). The rating
combines a flat base, defensive-structure contributions, and a garrison
ground-troop armor contribution. Per-type upgrade multipliers and the
empire-wide defense control upgrade are applied so purchased upgrades
meaningfully raise the rating.

import { getUnit } from './units.ts';
import { unitStatMultipliers } from './unitUpgrades.ts';
import { getEmpireUpgrade } from './empireUpgrades.ts';

const BASE_RATING = 50;
const GARRISON_ARMOR_FACTOR = 0.5;
const EMPIRE_DEFENSE_UPGRADE_ID = 'empire_defense_control_matrix_i';

export function computePlanetDefenseRating(empire, unitRecords) {
  const b = computePlanetDefenseBreakdown(empire, unitRecords);
  return b.total;
}

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

  const defenseUpgrade = getEmpireUpgrade(EMPIRE_DEFENSE_UPGRADE_ID);
  const defenseLevel = (empire?.empire_upgrade_levels || {})[EMPIRE_DEFENSE_UPGRADE_ID] || 0;
  const defenseBonus = defenseUpgrade && defenseLevel > 0 && typeof defenseUpgrade.bonus === 'number'
    ? defenseUpgrade.bonus
    : 0;
  const subtotal = base + structures + garrison;
  const research = subtotal * defenseBonus;
  const total = Math.round(subtotal + research);

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
