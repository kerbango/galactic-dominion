// Runtime view of the canonical research tree. This keeps the authored tree intact
// while applying research-to-upgrade, unit-gate, and economy-branch corrections.
import { TECH_TREE as BASE_TECH_TREE, normalizePrereqs, defaultResearchCost, getResearchCost, isPrimaryTech, getUnlocks } from './techTree.ts';
import { ECONOMY_TECH_TREE, ECONOMY_TECH_IDS } from './economyTechTree.ts';

const OVERRIDES = {
  planetary_growth_economics: { unlocks: undefined },
  economic_optimization: { unlocks: undefined },
  resource_dominance: { unlocks: undefined },
  tachyon_sensor_array: { unlocks: undefined },
  deep_space_survey_probe: { unlocks: undefined },
  anomaly_analysis_algorithms: { unlocks: undefined },
  atmospheric_hazard_cartography: { unlocks: undefined },
  warp_lane_optimization: { unlocks: undefined },
  fold_navigation: { unlocks: { upgrades: ['Exploration Speed IV'] } },

  centralized_administration: { unlocks: { upgrades: ['Population Growth I', 'Income Upgrade I'] } },
  empire_data_encryption: { unlocks: { upgrades: ['Secured Fleet Network I', 'Secured Fleet Network II'] } },
  counter_espionage: { unlocks: { upgrades: ['Anti Spy Network', 'Critical Spy Observation', 'Capture and Interrogate'] } },
  war_council: { unlocks: { upgrades: ['Alliance Bonus I', 'Alliance Bonus II'] } },
  taxation_doctrine: { unlocks: { upgrades: ['Tax Office I', 'Tax Office II', 'Tax Office III'] } },
  advanced_detection_grid: { unlocks: { upgrades: ['ECM Field Matrix I', 'ECM Field Matrix II', 'ECM Field Matrix III'] } },
  planetary_defense_architecture: { unlocks: { units: ['bunker', 'pdg'] } },
  heavy_battery_systems: { unlocks: { units: ['heavy_battery'] } },
  point_defense_grid: { unlocks: { units: ['pdg'] } },
  fortress_command: { unlocks: { units: ['orbit_defense_platform'] } },
  standard_hull_framing: { unlocks: { units: ['light_scout', 'light_frigate'] } },
  frigate_design: { unlocks: { units: ['medium_frigate', 'heavy_frigate'] } },
  destroyer_design: { unlocks: { units: ['light_destroyer', 'heavy_destroyer', 'phalanx_destroyer'] } },
  cruiser_hull: { unlocks: { units: ['light_cruiser'] } },
  carrier_architecture: { unlocks: { units: ['carrier', 'drone_carrier'] } },
  capital_hull_engineering: { unlocks: { units: ['battle_cruiser', 'Dreadnaught'] } },
  advanced_fleet_architecture: { unlocks: { units: ['quantum_jumpcarrier'] } },
  long_range_sensors: { unlocks: { units: ['light_explorer'] } },
  aero_probe_launcher: { unlocks: { units: ['light_explorer'] } },
  sub_light_mapping: { unlocks: { units: ['light_explorer'] } },
  subspace_beacon_network: { unlocks: { units: ['heavy_explorer'] } },
  blacklisted_alien_technology: { tier: 7, isGate: true },
  vampiric_field_generator: { unlocks: { upgrades: ['Vampiric Field Generator Single Target', 'Vampiric Field Generator Area'], units: ['vampiric_shieldship'] } },
};

const explorationUnlocks = {
  long_range_sensors: { upgrades: ['Exploration Speed I'], units: ['light_explorer'] },
  tachyon_sensor_array: { upgrades: ['Exploration Speed II'] },
  aero_probe_launcher: { upgrades: ['Resource Finder I'], units: ['light_explorer'] },
  deep_space_survey_probe: { upgrades: ['Resource Finder II'] },
  sub_light_mapping: { upgrades: ['Cost Reducer I'], units: ['light_explorer'] },
  anomaly_analysis_algorithms: { upgrades: ['Cost Reducer II'] },
  atmospheric_hazard_cartography: { upgrades: ['Resource Finder III'] },
  warp_lane_optimization: { upgrades: ['Exploration Speed III'] },
};

const baseRuntimeTree = BASE_TECH_TREE
  .filter((tech) => tech.category !== 'Economy and Resources')
  .map((tech) => {
    const patch = OVERRIDES[tech.id] || {};
    const exploration = explorationUnlocks[tech.id];
    const next = { ...tech, ...patch };
    if (Object.prototype.hasOwnProperty.call(patch, 'unlocks') && patch.unlocks === undefined) delete next.unlocks;
    if (exploration) next.unlocks = exploration;
    return next;
  });

export const TECH_TREE = [...baseRuntimeTree, ...ECONOMY_TECH_TREE];
export { ECONOMY_TECH_IDS };

export { normalizePrereqs, defaultResearchCost, getResearchCost, isPrimaryTech, getUnlocks };
export const CATEGORY_ORDER = ['Defense', 'Economy and Resources', 'Fleet Research', 'Exploration', 'Empire Governance'];
export const CATEGORIES = {
  Defense: { icon: 'Shield', color: 'text-red-300' },
  'Economy and Resources': { icon: 'Coins', color: 'text-yellow-300' },
  'Fleet Research': { icon: 'Rocket', color: 'text-cyan-300' },
  Exploration: { icon: 'Radar', color: 'text-emerald-300' },
  'Empire Governance': { icon: 'Crown', color: 'text-violet-300' },
};