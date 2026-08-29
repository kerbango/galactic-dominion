// Unit type definitions — single source of truth shared by frontend (via
// src/data/units.js) and backend functions. Each unit is gated by a tech:
// when that tech is completed, the unit becomes buildable on the Military
// page. Base stats are stored here for later combat integration; the build
// cost and build turns drive the timed-construction system. The ids match
// the `unlocks.units` entries in the tech tree.

export const UNITS = [
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
  id: "light_explorer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "heavy_explorer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "light_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "medium_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "heavy_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "stealth_boat",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "light_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "medium_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "heavy_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "light_destroyer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "heavy_destroyer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "phalanx_destroyer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "light_cruiser",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "battle_cruiser",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "drop_carrier",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "Dreadnaught",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "void_siphon",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "quantum_jumpcarrier",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "vampiric_shieldship",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "phase_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "bullk_frieghter",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "living_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defense Destroyer",
  description: "Defender Class Destroyer",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
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