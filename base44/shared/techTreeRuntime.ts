// Runtime view of the canonical tree. This keeps the large authored tree intact
// while applying the final research-to-upgrade gates that were approved for
// Galactic Dominion. The runtime view is what the UI and research endpoint use.
import { TECH_TREE as BASE_TECH_TREE, normalizePrereqs, defaultResearchCost, getResearchCost, isPrimaryTech, getUnlocks } from './techTree.ts';

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
  taxation_doctrine: { unlocks: { upgrades: ['Tax Office I', 'Tax Office II', 'Tax Office III'] } },

  blacklisted_alien_technology: { tier: 7, isGate: true },
  vampiric_field_generator: { unlocks: { upgrades: ['Vampiric Field Generator Single Target', 'Vampiric Field Generator Area'], units: ['vampiric_shieldship'] } },
};

const explorationUnlocks = {
  long_range_sensors: { upgrades: ['Exploration Speed I'] },
  tachyon_sensor_array: { upgrades: ['Exploration Speed II'] },
  aero_probe_launcher: { upgrades: ['Resource Finder I'] },
  deep_space_survey_probe: { upgrades: ['Resource Finder II'] },
  sub_light_mapping: { upgrades: ['Cost Reducer I'] },
  anomaly_analysis_algorithms: { upgrades: ['Cost Reducer II'] },
  atmospheric_hazard_cartography: { upgrades: ['Resource Finder III'] },
  warp_lane_optimization: { upgrades: ['Exploration Speed III'] },
};

export const TECH_TREE = BASE_TECH_TREE.map((tech) => {
  const patch = OVERRIDES[tech.id] || {};
  const exploration = explorationUnlocks[tech.id];
  const next = { ...tech, ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, 'unlocks') && patch.unlocks === undefined) delete next.unlocks;
  if (exploration) next.unlocks = exploration;
  return next;
});

export { normalizePrereqs, defaultResearchCost, getResearchCost, isPrimaryTech, getUnlocks };

export const CATEGORY_ORDER = ['Defense', 'Economy and Resources', 'Fleet Research', 'Exploration', 'Empire Governance'];
export const CATEGORIES = {
  Defense: { icon: 'Shield', color: 'text-red-300' },
  'Economy and Resources': { icon: 'Coins', color: 'text-yellow-300' },
  'Fleet Research': { icon: 'Rocket', color: 'text-cyan-300' },
  Exploration: { icon: 'Radar', color: 'text-emerald-300' },
  'Empire Governance': { icon: 'Crown', color: 'text-violet-300' },
};
