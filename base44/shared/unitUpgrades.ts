// Per-unit-type upgrade definitions. Each upgrade is scoped to a single unit
// type and gated by that unit's gating tech being completed (i.e. the unit
// being unlocked). Buying a level applies to ALL units of that type the
// player owns — upgrades are per-type, not per-individual-ship. Effects are
// stored as levels so combat can read them later; the effect is a stat
// multiplier (e.g. +10% attack/level).

const STANDARD_STATS = [
  { stat: "attack", name: "Weapon Calibration", perLevel: 0.10 },
  { stat: "defense", name: "Reinforced Hull", perLevel: 0.10 },
  { stat: "stealth", name: "Stealth Coating", perLevel: 0.10 },
  { stat: "shielding", name: "Shield Amplifier", perLevel: 0.10 },
  { stat: "hull_armor", name: "Hull Armor", perLevel: 0.10 },
  { stat: "speed", name: "Engine Tuning", perLevel: 0.08 },
  { stat: "range", name: "Targeting Range", perLevel: 0.10 },
  { stat: "efficiency", name: "Systems Efficiency", perLevel: 0.08 },
];

// Ground forces use Armor in place of shielding + hull_armor. Exploration is
// stored-only (no upgrade track), same as ships.
const GROUND_STATS = [
  { stat: "attack", name: "Weapon Calibration", perLevel: 0.10 },
  { stat: "armor", name: "Armor Plating", perLevel: 0.10 },
  { stat: "stealth", name: "Stealth Training", perLevel: 0.10 },
  { stat: "speed", name: "Mobility Tuning", perLevel: 0.08 },
  { stat: "range", name: "Targeting Range", perLevel: 0.10 },
  { stat: "efficiency", name: "Logistics Efficiency", perLevel: 0.08 },
];

// Defensive structures upgrade their defense rating, armor, and range.
const DEFENSE_STATS = [
  { stat: "defense_rating", name: "Defense Amplification", perLevel: 0.12 },
  { stat: "armor", name: "Reinforced Structure", perLevel: 0.10 },
  { stat: "range", name: "Targeting Range", perLevel: 0.10 },
];

// Exploration is a stored-only stat (no upgrade track) — read by future
// exploration/scouting mechanics, not boosted per-level.

// Base cost for a level-1 purchase, per unit type. Cost for level L scales as
// base x L (so level 2 costs 2x, level 3 costs 3x).
const BASE_COSTS = {
  carrier: { aetherium_crystal: 250, ferrite_titanium: 500, vrind: 450 },
  troop_transport: { ferrite_titanium: 400, vrind: 300 },
  infantry: { ferrite_titanium: 120, vrind: 100 },
  heavy_infantry: { ferrite_titanium: 180, vrind: 150 },
  assault_infantry: { ferrite_titanium: 160, vrind: 160 },
  mechanized_infantry: { ferrite_titanium: 300, vrind: 250 },
  mecha: { aetherium_crystal: 200, ferrite_titanium: 600, vrind: 500 },
  bunker: { ferrite_titanium: 350, vrind: 250 },
  pdg: { ferrite_titanium: 350, vrind: 250 },
  ground_ion_cannon: { aetherium_crystal: 120, ferrite_titanium: 400, vrind: 350 },
  orbit_defense_platform: { aetherium_crystal: 250, ferrite_titanium: 600, vrind: 600 },
  heavy_battery: { ferrite_titanium: 350, vrind: 250 },
};

function makeUpgrades(unitType, stats) {
  const base = BASE_COSTS[unitType] || {};
  return stats.map((s) => ({
    id: `${unitType}_${s.stat}`,
    unitType,
    name: s.name,
    description: `+${Math.round(s.perLevel * 100)}% ${s.stat} per level for all ${unitType.replace(/_/g, " ")}s.`,
    stat: s.stat,
    perLevel: s.perLevel,
    maxLevel: 3,
    baseCost: base,
  }));
}

export const UNIT_UPGRADES = [
  ...makeUpgrades("carrier", STANDARD_STATS),
  ...makeUpgrades("troop_transport", STANDARD_STATS),
  ...makeUpgrades("infantry", GROUND_STATS),
  ...makeUpgrades("heavy_infantry", GROUND_STATS),
  ...makeUpgrades("assault_infantry", GROUND_STATS),
  ...makeUpgrades("mechanized_infantry", GROUND_STATS),
  ...makeUpgrades("mecha", GROUND_STATS),
  ...makeUpgrades("bunker", DEFENSE_STATS),
  ...makeUpgrades("pdg", DEFENSE_STATS),
  ...makeUpgrades("ground_ion_cannon", DEFENSE_STATS),
  ...makeUpgrades("orbit_defense_platform", DEFENSE_STATS),
  ...makeUpgrades("heavy_battery", DEFENSE_STATS),
];

const upgradeById = new Map(UNIT_UPGRADES.map((u) => [u.id, u]));
export const getUnitUpgrade = (id) => upgradeById.get(id);

export function upgradesForUnit(unitType) {
  return UNIT_UPGRADES.filter((u) => u.unitType === unitType);
}

// Cost to purchase `level` (1-based) of this upgrade: base x level.
export function unitUpgradeCost(upgrade, level) {
  const L = Math.max(1, level || 1);
  const out = {};
  for (const [k, v] of Object.entries(upgrade.baseCost || {})) {
    out[k] = Math.floor(v * L);
  }
  return out;
}

// Next level to purchase given the current owned level, or null if maxed.
export function nextUnitUpgradeLevel(upgrade, currentLevel) {
  const next = (currentLevel || 0) + 1;
  return next <= upgrade.maxLevel ? next : null;
}

// Aggregate stat multiplier for a unit type from its purchased upgrade
// levels. Returns { attack: 1.2, defense: 1.1, speed: 1.0 } etc. Read by
// combat later; not consumed yet.
export function unitStatMultipliers(unitType, upgradeLevels) {
  const levels = upgradeLevels || {};
  const out = { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, armor: 1, defense_rating: 1, speed: 1, range: 1, efficiency: 1 };
  for (const up of upgradesForUnit(unitType)) {
    const lvl = levels[up.id] || 0;
    if (lvl > 0) out[up.stat] = (out[up.stat] || 1) * (1 + up.perLevel * lvl);
  }
  return out;
}