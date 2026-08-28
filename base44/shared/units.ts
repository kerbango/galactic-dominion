// Unit type definitions — single source of truth shared by frontend (via
// src/data/units.js) and backend functions. Each unit is gated by a tech:
// when that tech is completed, the unit becomes buildable on the Military
// page. Base stats are stored here for later combat integration; the build
// cost and build turns drive the timed-construction system. The ids match
// the `unlocks.units` entries in the tech tree.

export const UNITS = [
  {
    id: "scout_frigate",
    name: "Scout Frigate",
    description: "Fast, lightly-armed reconnaissance vessel.",
    gatingTechId: "basic_ship",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
  },
  {
    id: "freighter",
    name: "Freighter",
    description: "Slow cargo hauler for trade convoys.",
    gatingTechId: "freighters",
    buildTurns: 2,
    buildCost: { ferrite_titanium: 400, energy: 150, vrind: 250 },
    baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
  },
  {
    id: "battleship",
    name: "Battleship",
    description: "Heavily-armored capital warship.",
    gatingTechId: "battleship_hull",
    buildTurns: 4,
    buildCost: { ferrite_titanium: 2000, aetherium_crystal: 500, energy: 800, vrind: 1500 },
    baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
  },
  {
    id: "carrier",
    name: "Carrier",
    description: "Launches swarms of strike craft.",
    gatingTechId: "carrier_hull",
    buildTurns: 4,
    buildCost: { ferrite_titanium: 1800, aetherium_crystal: 600, energy: 700, vrind: 1400 },
    baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
  },
  {
    id: "titan",
    name: "Titan",
    description: "Vessel of immense scale and firepower.",
    gatingTechId: "titan_hull",
    buildTurns: 6,
    buildCost: { ferrite_titanium: 5000, aetherium_crystal: 2000, berentium: 500, energy: 2000, vrind: 4000 },
    baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
  },
  {
    id: "titan_class_vessel",
    name: "Titan-Class Vessel",
    description: "The pinnacle warship — a mobile fortress.",
    gatingTechId: "titan_class",
    buildTurns: 9,
    buildCost: { ferrite_titanium: 12000, aetherium_crystal: 6000, berentium: 2000, energy: 5000, vrind: 10000 },
    baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
  },
];

const unitById = new Map(UNITS.map((u) => [u.id, u]));
export const getUnit = (id) => unitById.get(id);

// A unit is unlocked when its gating tech is in the completed set.
export function isUnitUnlocked(unit, completedTechIds) {
  if (!unit.gatingTechId) return true;
  const set = completedTechIds instanceof Set ? completedTechIds : new Set(completedTechIds || []);
  return set.has(unit.gatingTechId);
}

export function getUnlockedUnits(completedTechIds) {
  const set = completedTechIds instanceof Set ? completedTechIds : new Set(completedTechIds || []);
  return UNITS.filter((u) => set.has(u.gatingTechId));
}