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
    baseStats: { attack: 90, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 90, speed: 1, range: 1, efficiency: 1 },
  },
  {
  id: "light_explorer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Class Galactic Explorer",
  description: "Ability to scan for and return resources!",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 100, shielding: 100, hull_armor: 100, speed: 20, range: 1, efficiency: 100 },
},
{
  id: "heavy_explorer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Heavy  Galactic Explorer",
  description: "Search the stars for Resourcees and Anchient Technology",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "light_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Scout",
  description: "Scout your enemies and return some data reports",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "medium_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Medium Scout",
  description: "Scout your enemies and return more detailed reports.",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "heavy_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Heavy Scout",
  description: "Scout your enemies and return full complete reports.",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "stealth_boat",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Stealth boat",
  description: "Ability to sneal past enemy defenses. Can only be detected by Anti Stealth Tech",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "light_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Defensive Frigate",
  description: "Protect the Empire with patrols",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "medium_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Medium Missle Frigate",
  description: "Plays both Attack and Defender roles",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "heavy_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Heavy Frigate",
  description: "Top of the Class in Defensive rolls.",
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
  name: "Heavy Destroyer",
  description: "Designed for Frigate and Cruiser Hunters",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "phalanx_destroyer",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Phalanx Detroyer",
  description: "A Destroyer Killer. Hunter Killer of the first class",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "light_cruiser",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Light Cruiser",
  description: "First Entry into Captial Ship class. Spearhead of an offensive fleet",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "battle_cruiser",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Battle Cruiser",
  description: "Designed to Attack or Defend Enemy Captial Ships",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "drone_carrier",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Drone Carrier",
  description: "Send swarms of offeenive drones against Enemy Light Craft",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "Dreadnaught",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Dreadnaught",
  description: "Largest Ship in the Fleet. Used as Flag Ships.",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "void_siphon",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Void Siphon",
  description: "Draws energy from the universe transfering it to the fleet to increase shileding",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "quantum_jumpcarrier",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Jump Carrier",
  description: "USed to deploy wings of interceptors for defense or antiship duties.",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "vampiric_shieldship",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Vampiric Shield Ship",
  description: "used to break through heavy shielding and weakening enemy ships.",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 1 },
},
{
  id: "phase_scout",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Phase Scout",
  description: "Top of Class Scout. Used to bypass enemy defense detection.",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 5, shielding: 1, hull_armor: 1, speed: 1, range: 1, efficiency: 10 },
},
{
  id: "bullk_frieghter",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "Bulk Freighter",
  description: "Carry more spoils of war home to the empire",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 1, hull_armor: 100, speed: 1, range: 1, efficiency: 100 },
},
{
  id: "living_frigate",                 // unique id, matches unlocks.units in techTree if you wire one
  name: "The Living Frigater",
  description: "Achient Tech creating a ship that cannot be killed by energy weapons.",
  buildTurns: 1,                     // construction time in ticks
  buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
  baseStats: { attack: 1, defense: 1, stealth: 1, exploration: 1, shielding: 100, hull_armor: 100, speed: 1, range: 1, efficiency: 100 },
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