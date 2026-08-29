// Unit type definitions — single source of truth shared by frontend (via
// src/data/units.js) and backend functions. Each unit is gated by a tech:
// when that tech is completed, the unit becomes buildable on the Military
// page. Base stats are stored here for later combat integration; the build
// cost and build turns drive the timed-construction system. The ids match
// the `unlocks.units` entries in the tech tree.
//
// Base stats use a 0–100 scale: ~1–10 negligible, 10–30 light, 30–50
// standard, 50–70 heavy, 70–90 capital, 90–100 flagship/super. Values are
// deliberately under 100 so per-type upgrades (up to ~+30%) still grow them.

export const UNITS = [
  {
    id: "carrier",
    name: "Carrier",
    description: "Launches swarms of strike craft.",
    gatingTechId: "carrier_hull",
    buildTurns: 4,
    buildCost: { ferrite_titanium: 1800, aetherium_crystal: 600, energy: 700, vrind: 1400 },
    baseStats: { attack: 25, defense: 45, stealth: 6, exploration: 15, shielding: 45, hull_armor: 60, speed: 25, range: 40, efficiency: 60 },
  },
  {
    id: "light_explorer",
    name: "Light Class Galactic Explorer",
    description: "Ability to scan for and return resources!",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 5, defense: 8, stealth: 35, exploration: 85, shielding: 6, hull_armor: 8, speed: 55, range: 30, efficiency: 75 },
  },
  {
    id: "heavy_explorer",
    name: "Heavy Galactic Explorer",
    description: "Search the stars for Resources and Ancient Technology",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 6, defense: 10, stealth: 45, exploration: 95, shielding: 8, hull_armor: 12, speed: 60, range: 40, efficiency: 85 },
  },
  {
    id: "light_scout",
    name: "Light Scout",
    description: "Scout your enemies and return some data reports",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 8, defense: 8, stealth: 60, exploration: 40, shielding: 6, hull_armor: 6, speed: 75, range: 25, efficiency: 55 },
  },
  {
    id: "medium_scout",
    name: "Medium Scout",
    description: "Scout your enemies and return more detailed reports.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 10, defense: 10, stealth: 68, exploration: 50, shielding: 8, hull_armor: 8, speed: 80, range: 30, efficiency: 60 },
  },
  {
    id: "heavy_scout",
    name: "Heavy Scout",
    description: "Scout your enemies and return full complete reports.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 12, defense: 12, stealth: 75, exploration: 60, shielding: 10, hull_armor: 10, speed: 82, range: 35, efficiency: 65 },
  },
  {
    id: "stealth_boat",
    name: "Stealth boat",
    description: "Ability to sneak past enemy defenses. Can only be detected by Anti Stealth Tech",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 15, defense: 12, stealth: 92, exploration: 30, shielding: 10, hull_armor: 10, speed: 70, range: 30, efficiency: 60 },
  },
  {
    id: "light_frigate",
    name: "Light Defensive Frigate",
    description: "Protect the Empire with patrols",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 30, defense: 38, stealth: 12, exploration: 12, shielding: 28, hull_armor: 38, speed: 38, range: 35, efficiency: 45 },
  },
  {
    id: "medium_frigate",
    name: "Medium Missile Frigate",
    description: "Plays both Attack and Defender roles",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 38, defense: 42, stealth: 14, exploration: 14, shielding: 34, hull_armor: 42, speed: 40, range: 42, efficiency: 48 },
  },
  {
    id: "heavy_frigate",
    name: "Heavy Frigate",
    description: "Top of the Class in Defensive roles.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 42, defense: 48, stealth: 12, exploration: 12, shielding: 40, hull_armor: 50, speed: 38, range: 45, efficiency: 50 },
  },
  {
    id: "light_destroyer",
    name: "Light Defense Destroyer",
    description: "Defender Class Destroyer",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 50, defense: 30, stealth: 12, exploration: 8, shielding: 22, hull_armor: 28, speed: 42, range: 50, efficiency: 38 },
  },
  {
    id: "heavy_destroyer",
    name: "Heavy Destroyer",
    description: "Designed for Frigate and Cruiser Hunters",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 60, defense: 35, stealth: 14, exploration: 8, shielding: 28, hull_armor: 34, speed: 45, range: 58, efficiency: 42 },
  },
  {
    id: "phalanx_destroyer",
    name: "Phalanx Destroyer",
    description: "A Destroyer Killer. Hunter Killer of the first class",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 70, defense: 38, stealth: 10, exploration: 6, shielding: 30, hull_armor: 36, speed: 44, range: 65, efficiency: 40 },
  },
  {
    id: "light_cruiser",
    name: "Light Cruiser",
    description: "First Entry into Capital Ship class. Spearhead of an offensive fleet",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 62, defense: 45, stealth: 8, exploration: 8, shielding: 42, hull_armor: 55, speed: 30, range: 48, efficiency: 40 },
  },
  {
    id: "battle_cruiser",
    name: "Battle Cruiser",
    description: "Designed to Attack or Defend Enemy Capital Ships",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 78, defense: 42, stealth: 6, exploration: 6, shielding: 48, hull_armor: 58, speed: 32, range: 58, efficiency: 42 },
  },
  {
    id: "drone_carrier",
    name: "Drone Carrier",
    description: "Send swarms of offensive drones against Enemy Light Craft",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 40, defense: 40, stealth: 8, exploration: 12, shielding: 40, hull_armor: 50, speed: 28, range: 45, efficiency: 55 },
  },
  {
    id: "Dreadnaught",
    name: "Dreadnaught",
    description: "Largest Ship in the Fleet. Used as Flag Ships.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 90, defense: 80, stealth: 6, exploration: 8, shielding: 78, hull_armor: 92, speed: 18, range: 72, efficiency: 38 },
  },
  {
    id: "void_siphon",
    name: "Void Siphon",
    description: "Draws energy from the universe transferring it to the fleet to increase shielding",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 20, defense: 40, stealth: 20, exploration: 15, shielding: 85, hull_armor: 35, speed: 30, range: 40, efficiency: 70 },
  },
  {
    id: "quantum_jumpcarrier",
    name: "Jump Carrier",
    description: "Used to deploy wings of interceptors for defense or antiship duties.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 30, defense: 48, stealth: 10, exploration: 14, shielding: 48, hull_armor: 55, speed: 30, range: 50, efficiency: 58 },
  },
  {
    id: "vampiric_shieldship",
    name: "Vampiric Shield Ship",
    description: "Used to break through heavy shielding and weakening enemy ships.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 65, defense: 30, stealth: 15, exploration: 10, shielding: 25, hull_armor: 30, speed: 35, range: 50, efficiency: 45 },
  },
  {
    id: "phase_scout",
    name: "Phase Scout",
    description: "Top of Class Scout. Used to bypass enemy defense detection.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 10, defense: 10, stealth: 85, exploration: 70, shielding: 8, hull_armor: 8, speed: 88, range: 35, efficiency: 75 },
  },
  {
    id: "bullk_frieghter",
    name: "Bulk Freighter",
    description: "Carry more spoils of war home to the empire",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 8, defense: 25, stealth: 8, exploration: 12, shielding: 20, hull_armor: 70, speed: 35, range: 30, efficiency: 80 },
  },
  {
    id: "living_frigate",
    name: "The Living Frigate",
    description: "Ancient Tech creating a ship that cannot be killed by energy weapons.",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 100 },
    baseStats: { attack: 88, defense: 90, stealth: 85, exploration: 85, shielding: 90, hull_armor: 92, speed: 85, range: 85, efficiency: 90 },
  },
  // ─────────────────────── GROUND FORCES ───────────────────────
  {
    id: "troop_transport",
    name: "Troop Transport",
    description: "Armored vessel designed to ferry ground forces into hostile territory.",
    category: "transport",
    gatingTechId: "planetary_invasion",
    buildTurns: 2,
    buildCost: { ferrite_titanium: 400, energy: 150, vrind: 300 },
    baseStats: { attack: 15, defense: 35, stealth: 10, exploration: 8, shielding: 30, hull_armor: 50, speed: 25, range: 30, efficiency: 50 },
    carryingCapacity: 50,
  },
  {
    id: "infantry",
    name: "Infantry",
    description: "Standard ground troops for planetary assault and defense.",
    category: "ground",
    gatingTechId: "planetary_invasion",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 100, energy: 50, vrind: 80 },
    baseStats: { attack: 20, speed: 30, stealth: 15, exploration: 10, armor: 25, range: 15, efficiency: 60 },
  },
  {
    id: "heavy_infantry",
    name: "Heavy Infantry",
    description: "Heavily armored ground troops that excel at holding defensive positions.",
    category: "ground",
    gatingTechId: "planetary_invasion",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 150, energy: 80, vrind: 120 },
    baseStats: { attack: 25, speed: 20, stealth: 10, exploration: 8, armor: 50, range: 20, efficiency: 50 },
  },
  {
    id: "assault_infantry",
    name: "Assault Infantry",
    description: "Aggressive shock troops optimized for breaking enemy fortifications.",
    category: "ground",
    gatingTechId: "planetary_invasion",
    buildTurns: 1,
    buildCost: { ferrite_titanium: 140, energy: 90, vrind: 130 },
    baseStats: { attack: 45, speed: 35, stealth: 20, exploration: 12, armor: 20, range: 25, efficiency: 55 },
  },
  {
    id: "mechanized_infantry",
    name: "Mechanized Infantry",
    description: "Vehicle-mounted infantry combining mobility with firepower and protection.",
    category: "ground",
    gatingTechId: "planetary_invasion",
    buildTurns: 2,
    buildCost: { ferrite_titanium: 250, energy: 120, vrind: 200 },
    baseStats: { attack: 55, speed: 45, stealth: 8, exploration: 15, armor: 55, range: 35, efficiency: 45 },
  },
  {
    id: "mecha",
    name: "Mecha",
    description: "Colossal walking war machines that dominate any battlefield they stride onto.",
    category: "ground",
    gatingTechId: "planetary_invasion",
    buildTurns: 3,
    buildCost: { ferrite_titanium: 500, aetherium_crystal: 200, energy: 250, vrind: 400 },
    baseStats: { attack: 80, speed: 30, stealth: 5, exploration: 10, armor: 85, range: 50, efficiency: 35 },
  },
  // ──────────────────── DEFENSIVE STRUCTURES ────────────────────
  {
    id: "bunker",
    name: "Planetary Bunker",
    description: "Reinforced underground installation that significantly boosts planetary defense rating.",
    category: "defense",
    gatingTechId: "planetary_fortifications",
    buildTurns: 2,
    buildCost: { ferrite_titanium: 300, energy: 100, vrind: 200 },
    baseStats: { defense_rating: 40, armor: 70, range: 20 },
  },
  {
    id: "ground_ion_cannon",
    name: "Ground-Based Ion Cannon",
    description: "Surface-mounted ion weapon that strikes approaching fleets before they land.",
    category: "defense",
    gatingTechId: "planetary_fortifications",
    buildTurns: 2,
    buildCost: { ferrite_titanium: 350, aetherium_crystal: 100, energy: 200, vrind: 300 },
    baseStats: { defense_rating: 60, armor: 30, range: 70 },
  },
  {
    id: "orbit_defense_platform",
    name: "Orbit Defense Platform",
    description: "Orbital fortification projecting a defensive umbrella across the entire planet.",
    category: "defense",
    gatingTechId: "planetary_fortifications",
    buildTurns: 3,
    buildCost: { ferrite_titanium: 500, aetherium_crystal: 200, energy: 300, vrind: 500 },
    baseStats: { defense_rating: 90, armor: 50, range: 85 },
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