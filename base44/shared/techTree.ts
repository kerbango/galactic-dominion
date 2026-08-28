// Canonical technology tree dataset — single source of truth shared by the
// frontend (via src/data/techTree.js re-export) and backend functions
// (startResearch, tickResources). Adding a tech here automatically creates
// its node and connection lines in the UI; the layout is derived from
// tier + category, never hard-coded.

export const CATEGORIES = {
  Energy: { icon: "Zap", color: "text-amber-300" },
  Construction: { icon: "Hammer", color: "text-orange-300" },
  Computing: { icon: "Cpu", color: "text-violet-300" },
  Propulsion: { icon: "Rocket", color: "text-sky-300" },
  Industry: { icon: "Factory", color: "text-lime-300" },
  Weapons: { icon: "Sword", color: "text-rose-300" },
  Biotechnology: { icon: "Dna", color: "text-emerald-300" },
  Economics: { icon: "Coins", color: "text-yellow-300" },
  Military: { icon: "Shield", color: "text-red-300" },
  "Ship Technology": { icon: "Ship", color: "text-blue-300" },
  Terraforming: { icon: "Globe", color: "text-teal-300" },
  Automation: { icon: "Bot", color: "text-cyan-300" },
};

// Vertical order of category bands in the auto-layout.
export const CATEGORY_ORDER = [
  "Military",
  "Construction",
  "Computing",
  "Propulsion",
  "Industry",
  "Weapons",
  "Biotechnology",
  "Economics",
  "Energy",
  "Ship Technology",
  "Terraforming",
  "Automation",
];

export const TECH_TREE = [
  // ───────────────────────── TIER 1 — roots ─────────────────────────
  { id: "fleet_research", name: "Fleet Power", description: "Research Hulls and Fleet Technology", category: "military", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_materials", name: "Alloy Smelting", description: "Refine ferrite-titanium into structural alloys.", category: "Construction", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_computing", name: "Logic Circuits", description: "Programmable logic for control systems.", category: "Computing", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_propulsion", name: "Chemical Thrusters", description: "Reliable reaction drives for early ships.", category: "Propulsion", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_industry", name: "Automated Mining", description: "Extractor drones harvest raw ore.", category: "Industry", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_weapons", name: "Kinetic Cannons", description: "Mass-driver weapons for defense.", category: "Weapons", icon: "Crosshair", researchTurns: 1, prerequisites: [], tier: 1, unlocks: { weapons: ["kinetic_cannon"] } },
  { id: "basic_bio", name: "Hydroponics", description: "Closed-loop food production.", category: "Biotechnology", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_econ", name: "Trade Routes", description: "Standardized inter-colony commerce.", category: "Economics", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_military", name: "Militia Training", description: "Organized planetary defense forces.", category: "Military", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_ship", name: "Orbital Frames", description: "Modular hull frameworks for stations.", category: "Ship Technology", researchTurns: 1, prerequisites: [], tier: 1, isPrimary: true, unlocks: { units: ["scout_frigate"] } },
  { id: "basic_terraforming", name: "Soil Conditioning", description: "Render barren regolith arable.", category: "Terraforming", researchTurns: 1, prerequisites: [], tier: 1 },
  { id: "basic_automation", name: "Simple Machines", description: "Mechanized assistance for labor.", category: "Automation", researchTurns: 1, prerequisites: [], tier: 1 },

  // ───────────────────────── TIER 2 ─────────────────────────
  { id: "ion_beams", name: "Ion Beams", description: "Focused ion streams as ship-scale weapons.", category: "Weapons", icon: "Zap", researchTurns: 2, prerequisites: ["basic_power"], tier: 2 },
  { id: "laser_weapons", name: "Laser Batteries", description: "Coherent-light point defense.", category: "Weapons", icon: "Sun", researchTurns: 2, prerequisites: ["basic_weapons"], tier: 2, isPrimary: true, unlocks: { weapons: ["laser_battery"] } },
  { id: "missile_weapons", name: "Missile Pods", description: "Guided ordnance salvos.", category: "Weapons", icon: "Rocket", researchTurns: 2, prerequisites: ["basic_weapons"], tier: 2 },
  { id: "energy_storage", name: "Capacitor Banks", description: "Store surplus energy for surges.", category: "Energy", researchTurns: 2, prerequisites: ["basic_power"], tier: 2 },
  { id: "shielding", name: "Deflector Shields", description: "Energy barriers against weapons fire.", category: "Energy", researchTurns: 2, prerequisites: ["basic_power"], tier: 2 },
  { id: "advanced_alloys", name: "Composite Plating", description: "Layered armor for hulls.", category: "Construction", researchTurns: 2, prerequisites: ["basic_materials"], tier: 2 },
  { id: "microprocessors", name: "Microprocessors", description: "Dense logic for automation.", category: "Computing", researchTurns: 2, prerequisites: ["basic_computing"], tier: 2 },
  { id: "cyber_warfare", name: "Cyber Warfare", description: "Electronic intrusion and defense.", category: "Computing", researchTurns: 2, prerequisites: ["basic_computing"], tier: 2 },
  { id: "sensor_arrays", name: "Sensor Arrays", description: "Long-range detection grids.", category: "Computing", researchTurns: 2, prerequisites: ["basic_computing"], tier: 2 },
  { id: "ion_drive", name: "Ion Drive", description: "Efficient long-endurance thrust.", category: "Propulsion", researchTurns: 2, prerequisites: ["basic_propulsion"], tier: 2 },
  { id: "freighters", name: "Freighters", description: "Bulk cargo hulls.", category: "Ship Technology", researchTurns: 2, prerequisites: ["basic_propulsion"], tier: 2, isPrimary: true, unlocks: { units: ["freighter"] } },
  { id: "orbital_mining", name: "Orbital Mining", description: "Strip-mine asteroids and moons.", category: "Industry", researchTurns: 2, prerequisites: ["basic_industry"], tier: 2 },
  { id: "mass_production", name: "Mass Production", description: "Standardized output at scale.", category: "Industry", researchTurns: 2, prerequisites: ["basic_industry"], tier: 2 },
  { id: "genetics", name: "Genetic Engineering", description: "Edit crop and livestock genomes.", category: "Biotechnology", researchTurns: 2, prerequisites: ["basic_bio"], tier: 2 },
  { id: "banking", name: "Central Banking", description: "Stabilize and expand the economy.", category: "Economics", researchTurns: 2, prerequisites: ["basic_econ"], tier: 2 },
  { id: "command", name: "Command Doctrine", description: "Coordinated fleet tactics.", category: "Military", researchTurns: 2, prerequisites: ["basic_military"], tier: 2 },
  { id: "orbital_defense", name: "Orbital Defense", description: "Stationed defense platforms.", category: "Military", researchTurns: 2, prerequisites: ["basic_military", "basic_ship"], tier: 2 },
  { id: "soil_regen", name: "Soil Regeneration", description: "Accelerate ecosystem recovery.", category: "Terraforming", researchTurns: 2, prerequisites: ["basic_terraforming"], tier: 2 },
  { id: "assembly_lines", name: "Assembly Lines", description: "Sequential automated fabrication.", category: "Automation", researchTurns: 2, prerequisites: ["basic_automation"], tier: 2 },

  // ───────────────────────── TIER 3 ─────────────────────────
  { id: "heavy_ion_beams", name: "Heavy Ion Beams", description: "Capital-scale ion weaponry.", category: "Weapons", icon: "Zap", researchTurns: 3, prerequisites: ["ion_beams"], tier: 3 },
  { id: "turbolasers", name: "Turbolasers", description: "Rapid-fire coherent beams.", category: "Weapons", icon: "Sun", researchTurns: 3, prerequisites: ["laser_weapons"], tier: 3, isPrimary: true, unlocks: { weapons: ["turbolaser_array"] } },
  { id: "guided_missiles", name: "Guided Missiles", description: "Smart ordnance with terminal guidance.", category: "Weapons", icon: "Rocket", researchTurns: 3, prerequisites: ["missile_weapons"], tier: 3 },
  { id: "point_defense", name: "Point Defense", description: "Intercept incoming ordnance.", category: "Weapons", icon: "Crosshair", researchTurns: 3, prerequisites: ["laser_weapons"], tier: 3 },
  { id: "antimatter_reactor", name: "Antimatter Reactor", description: "Matter-annihilation power.", category: "Energy", researchTurns: 3, prerequisites: ["energy_storage"], tier: 3 },
  { id: "shield_harmonics", name: "Shield Harmonics", description: "Tunable defensive frequencies.", category: "Energy", researchTurns: 3, prerequisites: ["shielding"], tier: 3 },
  { id: "fuel_refining", name: "Fuel Refining", description: "High-density propellants.", category: "Energy", researchTurns: 3, prerequisites: ["energy_storage"], tier: 3 },
  { id: "nanotech", name: "Nanotech Assembly", description: "Build structures molecule by molecule.", category: "Construction", researchTurns: 3, prerequisites: ["advanced_alloys"], tier: 3 },
  { id: "habitat_domes", name: "Habitat Domes", description: "Sealed colony structures.", category: "Construction", researchTurns: 3, prerequisites: ["advanced_alloys"], tier: 3 },
  { id: "quantum_computing", name: "Quantum Computing", description: "Superposed logic at scale — accelerates all future research.", category: "Computing", researchTurns: 3, prerequisites: ["microprocessors"], tier: 3, unlocks: { abilities: ["research_speed"] } },
  { id: "electronic_warfare", name: "Electronic Warfare", description: "Disrupt enemy systems.", category: "Computing", researchTurns: 3, prerequisites: ["cyber_warfare"], tier: 3 },
  { id: "warp_drive", name: "Warp Drive", description: "Fold space for faster transit.", category: "Propulsion", researchTurns: 3, prerequisites: ["ion_drive"], tier: 3 },
  { id: "freighter_fleets", name: "Freighter Fleets", description: "Coordinated trade convoys.", category: "Ship Technology", researchTurns: 3, prerequisites: ["freighters", "banking"], tier: 3 },
  { id: "deep_mining", name: "Deep Core Mining", description: "Tap planetary mantles.", category: "Industry", researchTurns: 3, prerequisites: ["orbital_mining"], tier: 3 },
  { id: "robotics", name: "Robotics", description: "Autonomous labor units.", category: "Automation", researchTurns: 3, prerequisites: ["mass_production", "microprocessors"], tier: 3 },
  { id: "biofuels", name: "Biofuel Synthesis", description: "Engineered microbes yield fuel.", category: "Biotechnology", researchTurns: 3, prerequisites: ["genetics"], tier: 3 },
  { id: "stock_market", name: "Stock Exchange", description: "Liquid investment markets.", category: "Economics", researchTurns: 3, prerequisites: ["banking"], tier: 3 },
  { id: "trade_guilds", name: "Trade Guilds", description: "Regulated merchant cartels.", category: "Economics", researchTurns: 3, prerequisites: ["banking"], tier: 3 },
  { id: "fleet_command", name: "Fleet Command", description: "Multi-squadron coordination.", category: "Military", researchTurns: 3, prerequisites: ["command"], tier: 3 },
  { id: "atmosphere_processing", name: "Atmosphere Processing", description: "Tailor planetary atmospheres.", category: "Terraforming", researchTurns: 3, prerequisites: ["soil_regen"], tier: 3 },

  // ───────────────────────── TIER 4 ─────────────────────────
  { id: "neutron_beams", name: "Neutron Beams", description: "Skip armor, kill crews.", category: "Weapons", icon: "Atom", researchTurns: 4, prerequisites: ["heavy_ion_beams"], tier: 4 },
  { id: "advanced_turbolasers", name: "Advanced Turbolasers", description: "Overcharged beam arrays.", category: "Weapons", icon: "Sun", researchTurns: 4, prerequisites: ["turbolasers"], tier: 4 },
  { id: "plasma_weapons", name: "Plasma Focusing", description: "Confine plasma into lances.", category: "Weapons", icon: "Flame", researchTurns: 4, prerequisites: ["heavy_ion_beams"], tier: 4, unlocks: { weapons: ["plasma_cannon"], upgrades: ["plasma_efficiency"] } },
  { id: "torpedo_systems", name: "Torpedo Systems", description: "Capital-grade warheads.", category: "Weapons", icon: "Rocket", researchTurns: 4, prerequisites: ["guided_missiles"], tier: 4 },
  { id: "zero_point_energy", name: "Zero-Point Energy", description: "Tap vacuum fluctuations.", category: "Energy", researchTurns: 4, prerequisites: ["antimatter_reactor"], tier: 4 },
  { id: "phase_shields", name: "Phase Shields", description: "Partial-phasing defenses.", category: "Energy", researchTurns: 4, prerequisites: ["shield_harmonics"], tier: 4 },
  { id: "metamaterials", name: "Metamaterials", description: "Engineered optical and structural properties.", category: "Construction", researchTurns: 4, prerequisites: ["nanotech"], tier: 4 },
  { id: "ai_core", name: "AI Core", description: "General machine intelligence.", category: "Computing", researchTurns: 4, prerequisites: ["quantum_computing", "robotics"], tier: 4 },
  { id: "cyber_command", name: "Cyber Command", description: "Theater-scale info warfare.", category: "Computing", researchTurns: 4, prerequisites: ["electronic_warfare"], tier: 4 },
  { id: "stealth_systems", name: "Stealth Systems", description: "Cloak ships from sensors.", category: "Computing", researchTurns: 4, prerequisites: ["electronic_warfare"], tier: 4 },
  { id: "jump_drive", name: "Jump Drive", description: "Instant point-to-point jumps.", category: "Propulsion", researchTurns: 4, prerequisites: ["warp_drive"], tier: 4 },
  { id: "orbital_shipyards", name: "Orbital Shipyards", description: "Build ships in orbit.", category: "Ship Technology", researchTurns: 4, prerequisites: ["advanced_alloys", "ion_drive"], tier: 4, isPrimary: true, unlocks: { buildings: ["orbital_shipyard"] } },
  { id: "interceptor", name: "Interceptors", description: "Fast strike craft.", category: "Ship Technology", researchTurns: 4, prerequisites: ["freighters", "laser_weapons"], tier: 4 },
  { id: "automated_factory", name: "Automated Factories", description: "Lights-out production.", category: "Automation", researchTurns: 4, prerequisites: ["robotics"], tier: 4 },
  { id: "advanced_plasma", name: "Advanced Plasma Weapons", description: "Stable plasma lances with antimatter containment.", category: "Weapons", icon: "Flame", researchTurns: 4, prerequisites: ["plasma_weapons", "antimatter_reactor"], tier: 4 },
  { id: "cybernetics", name: "Cybernetics", description: "Merge flesh and machine.", category: "Biotechnology", researchTurns: 4, prerequisites: ["genetics", "microprocessors"], tier: 4 },
  { id: "terraforming_advanced", name: "Ecosystem Engineering", description: "Whole-biosphere design.", category: "Terraforming", researchTurns: 4, prerequisites: ["atmosphere_processing"], tier: 4 },

  // ───────────────────────── TIER 5 ─────────────────────────
  { id: "disruptors", name: "Disruptors", description: "Molecular-bond disruption.", category: "Weapons", icon: "Atom", researchTurns: 5, prerequisites: ["plasma_weapons"], tier: 5 },
  { id: "primary_beams", name: "Primary Beams", description: "Spinal-mount beam cannons.", category: "Weapons", icon: "Zap", researchTurns: 5, prerequisites: ["disruptors"], tier: 5 },
  { id: "neutron_lances", name: "Neutron Lances", description: "Sustained neutron streams.", category: "Weapons", icon: "Atom", researchTurns: 5, prerequisites: ["neutron_beams"], tier: 5 },
  { id: "singularity_engine", name: "Singularity Engine", description: "Contain a micro black hole.", category: "Energy", researchTurns: 5, prerequisites: ["zero_point_energy"], tier: 5 },
  { id: "adaptive_armor", name: "Adaptive Armor", description: "Reactive self-repairing plating.", category: "Construction", researchTurns: 5, prerequisites: ["metamaterials"], tier: 5 },
  { id: "neural_net", name: "Neural Networks", description: "Deep learning at fleet scale.", category: "Computing", researchTurns: 5, prerequisites: ["ai_core"], tier: 5 },
  { id: "quantum_stealth", name: "Quantum Stealth", description: "Near-total concealment.", category: "Computing", researchTurns: 5, prerequisites: ["stealth_systems", "quantum_computing"], tier: 5 },
  { id: "hyperspace_drive", name: "Hyperspace Drive", description: "Transit through hyperspace.", category: "Propulsion", researchTurns: 5, prerequisites: ["jump_drive"], tier: 5 },
  { id: "battleship_hull", name: "Battleship Hull", description: "Capital warship frame.", category: "Ship Technology", researchTurns: 5, prerequisites: ["orbital_shipyards", "turbolasers"], tier: 5, isPrimary: true, unlocks: { units: ["battleship"], upgrades: ["reinforced_hull_ii"] } },
  { id: "carrier_hull", name: "Carrier Hull", description: "Launch swarm craft.", category: "Ship Technology", researchTurns: 5, prerequisites: ["orbital_shipyards", "guided_missiles"], tier: 5, isPrimary: true, unlocks: { units: ["carrier"] } },
  { id: "swarm_robotics", name: "Swarm Robotics", description: "Coordinated micro-drone swarms.", category: "Automation", researchTurns: 5, prerequisites: ["automated_factory"], tier: 5 },
  { id: "planetary_shield", name: "Planetary Shield", description: "World-scale defense.", category: "Military", researchTurns: 5, prerequisites: ["phase_shields", "metamaterials"], tier: 5 },
  { id: "bio_warfare", name: "Bio-Warfare", description: "Targeted bioweapons.", category: "Biotechnology", researchTurns: 5, prerequisites: ["cybernetics"], tier: 5 },
  { id: "gaia_terraforming", name: "Gaia Transformation", description: "Engineer paradise worlds.", category: "Terraforming", researchTurns: 5, prerequisites: ["terraforming_advanced"], tier: 5 },
  { id: "megastructures", name: "Megastructures", description: "Build at planetary scale.", category: "Construction", researchTurns: 5, prerequisites: ["metamaterials", "mass_production"], tier: 5 },
  { id: "fleet_logistics", name: "Fleet Logistics", description: "Sustain fleets across the void.", category: "Military", researchTurns: 5, prerequisites: ["stock_market", "jump_drive"], tier: 5 },

  // ───────────────────────── TIER 6 ─────────────────────────
  { id: "death_ray", name: "Death Ray", description: "Planet-cracking beam.", category: "Weapons", icon: "Skull", researchTurns: 7, prerequisites: ["primary_beams"], tier: 6 },
  { id: "antimatter_torpedoes", name: "Antimatter Torpedoes", description: "Annihilation warheads.", category: "Weapons", icon: "Rocket", researchTurns: 6, prerequisites: ["torpedo_systems", "antimatter_reactor"], tier: 6 },
  { id: "dark_matter", name: "Dark Matter Extraction", description: "Harvest exotic mass.", category: "Energy", researchTurns: 7, prerequisites: ["singularity_engine"], tier: 6 },
  { id: "living_metal", name: "Living Metal", description: "Self-repairing smart matter.", category: "Construction", researchTurns: 6, prerequisites: ["adaptive_armor", "nanotech"], tier: 6 },
  { id: "sentience", name: "Artificial Sentience", description: "Self-aware machine minds.", category: "Computing", researchTurns: 7, prerequisites: ["neural_net"], tier: 6 },
  { id: "wormhole_drive", name: "Wormhole Drive", description: "Stabilized wormhole transit.", category: "Propulsion", researchTurns: 6, prerequisites: ["hyperspace_drive"], tier: 6 },
  { id: "titan_hull", name: "Titan Hull", description: "Vessels of immense scale.", category: "Ship Technology", researchTurns: 6, prerequisites: ["battleship_hull", "living_metal"], tier: 6, isPrimary: true, unlocks: { units: ["titan"], upgrades: ["heavy_armor"] } },
  { id: "bio_ships", name: "Bio-Ships", description: "Living vessels.", category: "Ship Technology", researchTurns: 6, prerequisites: ["titan_hull", "cybernetics"], tier: 6 },
  { id: "nanoswarm", name: "Nanoswarm", description: "Disassembler clouds.", category: "Automation", researchTurns: 6, prerequisites: ["swarm_robotics"], tier: 6 },
  { id: "battlestation", name: "Battlestation", description: "Armed orbital fortresses.", category: "Military", researchTurns: 6, prerequisites: ["planetary_shield", "orbital_shipyards"], tier: 6 },
  { id: "gene_targeting", name: "Gene Targeting", description: "Species-specific bioweapons.", category: "Biotechnology", researchTurns: 6, prerequisites: ["bio_warfare"], tier: 6 },
  { id: "ringworld_frame", name: "Ringworld Frame", description: "Habitable rings around stars.", category: "Construction", researchTurns: 8, prerequisites: ["megastructures", "dark_matter"], tier: 6 },
  { id: "grand_fleet", name: "Grand Armada", description: "Unified national fleet.", category: "Military", researchTurns: 6, prerequisites: ["fleet_logistics", "battleship_hull"], tier: 6 },
  { id: "stealth_fleet", name: "Stealth Fleet", description: "Undetectable strike groups.", category: "Military", researchTurns: 6, prerequisites: ["stealth_systems", "fleet_command"], tier: 6 },

  // ───────────────────────── TIER 7 — capstones ─────────────────────────
  { id: "doomsday", name: "Doomsday Weapon", description: "End worlds in a single shot.", category: "Weapons", icon: "Skull", researchTurns: 11, prerequisites: ["death_ray", "singularity_engine"], tier: 7 },
  { id: "stellar_engine", name: "Stellar Engine", description: "Move and harvest entire stars.", category: "Energy", researchTurns: 10, prerequisites: ["dark_matter", "ringworld_frame"], tier: 7 },
  { id: "ascension", name: "Technological Ascension", description: "Transcend physical limits.", category: "Computing", researchTurns: 12, prerequisites: ["sentience", "dark_matter"], tier: 7 },
  { id: "void_drive", name: "Void Drive", description: "Step between galaxies.", category: "Propulsion", researchTurns: 10, prerequisites: ["wormhole_drive", "dark_matter"], tier: 7 },
  { id: "titan_class", name: "Titan-Class Vessel", description: "The pinnacle warship.", category: "Ship Technology", researchTurns: 9, prerequisites: ["titan_hull", "death_ray"], tier: 7, isPrimary: true, unlocks: { units: ["titan_class_vessel"], weapons: ["spinal_mount_cannon"] } },
  { id: "immortality", name: "Biological Immortality", description: "End aging.", category: "Biotechnology", researchTurns: 10, prerequisites: ["gene_targeting", "sentience"], tier: 7 },
  { id: "ringworld", name: "Ringworld", description: "A finished ringworld.", category: "Construction", researchTurns: 11, prerequisites: ["ringworld_frame", "gaia_terraforming"], tier: 7 },
  { id: "galactic_command", name: "Galactic Command", description: "Command all fleets at once.", category: "Military", researchTurns: 9, prerequisites: ["grand_fleet", "titan_hull"], tier: 7 },
];

// ── Derived tech helpers (data layer) ──────────────────────────────
// Backward-compatible prerequisite normalization: a plain array is treated
// as an AND group ({ all: [...], any: [] }). New techs may use the object
// form to express AND (all) and OR (any) prerequisites.
export function normalizePrereqs(tech) {
  const p = tech.prerequisites;
  if (Array.isArray(p)) return { all: p, any: [] };
  return { all: (p && p.all) || [], any: (p && p.any) || [] };
}

// Default resource cost scales with tier. A tech may override by setting
// its own researchCost map.
export function defaultResearchCost(tier) {
  const scale = Math.pow(2, tier - 1);
  return {
    research_points: 20 * scale,
    vrind: 40 * scale,
  };
}

export function getResearchCost(tech) {
  return tech.researchCost || defaultResearchCost(tech.tier);
}

// Primary techs form the main progression chains; supporting techs branch
// off them. Defaults to true for tier-1 roots and tier-7 capstones; any tech
// can override with isPrimary: true/false.
export function isPrimaryTech(tech) {
  if (tech.isPrimary != null) return tech.isPrimary === true;
  return tech.tier === 1 || tech.tier === 7;
}

// Grouped gameplay unlocks. Empty by default; populated per tech to display
// units/weapons/upgrades/buildings/abilities in the info panel.
export function getUnlocks(tech) {
  return tech.unlocks || {};
}