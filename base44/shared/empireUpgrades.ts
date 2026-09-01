// Empire-wide upgrade definitions.
// Each Roman-numeral upgrade is a distinct one-time purchase unlocked by research.

const makeUpgrade = (name, description, gatingTechId, effectLabel, bonus, cost = { aetherium_crystal: 300, ferrite_titanium: 600, vrind: 800 }) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  name,
  description,
  gatingTechId,
  effectLabel,
  bonus,
  cost,
  maxLevel: 1,
});

export const EMPIRE_UPGRADES = [
  makeUpgrade("Population Growth I", "Increases empire population growth.", "planetary_growth_economics", "Population Growth", 0.05),
  makeUpgrade("Population Growth II", "Further increases empire population growth.", "planetary_growth_matrix", "Population Growth", 0.05),
  makeUpgrade("Population Growth III", "Further increases empire population growth.", "imperial_networking", "Population Growth", 0.05),

  makeUpgrade("Income Upgrade I", "Strictly increases recurring VRIND income.", "economic_optimization", "VRIND Income", 0.05),
  makeUpgrade("Income Upgrade II", "Strictly increases recurring VRIND income.", "tachyon_communications", "VRIND Income", 0.05),
  makeUpgrade("Income Upgrade III", "Strictly increases recurring VRIND income.", "imperial_directives", "VRIND Income", 0.05),

  makeUpgrade("Resource Finder I", "Increases resources found during exploration.", "deep_space_survey_probe", "Resources Found", 0.05),
  makeUpgrade("Resource Finder II", "Further increases resources found during exploration.", "atmospheric_hazard_cartography", "Resources Found", 0.05),
  makeUpgrade("Resource Finder III", "Further increases resources found during exploration.", "atmospheric_hazard_cartography", "Resources Found", 0.05),

  makeUpgrade("Cost Reducer I", "Reduces Exploration Ship energy cost.", "anomaly_analysis_algorithms", "Exploration Energy Cost", -0.05),
  makeUpgrade("Cost Reducer II", "Further reduces Exploration Ship energy cost.", "warp_lane_optimization", "Exploration Energy Cost", -0.10),

  makeUpgrade("Exploration Speed I", "Makes exploration 5% faster.", "tachyon_sensor_array", "Exploration Time", -0.05),
  makeUpgrade("Exploration Speed II", "Makes exploration 10% faster.", "relic_matrices", "Exploration Time", -0.10),
  makeUpgrade("Exploration Speed III", "Makes exploration 15% faster.", "warp_lane_optimization", "Exploration Time", -0.15),
  makeUpgrade("Exploration Speed IV", "Makes exploration 20% faster.", "fold_navigation", "Exploration Time", -0.20),

  makeUpgrade("ECM Field Matrix I", "Provides 33% planetary ECM detection capability.", "advanced_detection_grid", "ECM Detection", 0.33),
  makeUpgrade("ECM Field Matrix II", "Provides 66% planetary ECM detection capability.", "advanced_detection_grid", "ECM Detection", 0.66),
  makeUpgrade("ECM Field Matrix III", "Provides 99% planetary ECM detection capability.", "advanced_detection_grid", "ECM Detection", 0.99),

  makeUpgrade("Empire Defense Control Matrix I", "Increases overall empire defense numbers by 10%.", "planetary_fortress_network", "Empire Defense", 0.10),

  makeUpgrade("Tax Office I", "Increases VRIND income by 5% per hour.", "resource_dominance", "VRIND Income", 0.05),
  makeUpgrade("Tax Office II", "Increases VRIND income by 10% per hour.", "resource_dominance", "VRIND Income", 0.10),
  makeUpgrade("Tax Office III", "Increases VRIND income by 15% per hour.", "resource_dominance", "VRIND Income", 0.15),

  makeUpgrade("TAX EVASION I", "Completely removes Global Market tax.", "galactic_trade_manipulation_ai", "Global Market Tax", -1.0),

  makeUpgrade("Alliance Bonus I", "Provides an alliance attack bonus when striking the same enemy.", "war_council", "Alliance Attack", 0.05),
  makeUpgrade("Alliance Bonus II", "Further increases the alliance attack bonus when striking the same enemy.", "war_council", "Alliance Attack", 0.10),

  makeUpgrade("Secured Fleet Network I", "Improves protection against hostile scouting.", "empire_data_encryption", "Scout Information Protection", 0.25),
  makeUpgrade("Secured Fleet Network II", "Further improves protection against hostile scouting.", "empire_data_encryption", "Scout Information Protection", 0.50),

  makeUpgrade("Anti Spy Network", "Detects hostile spies.", "counter_espionage", "Spy Detection", 0.25),
  makeUpgrade("Critical Spy Observation", "Hinders hostile spies from reporting complete information.", "counter_espionage", "Spy Disruption", 0.25),
  makeUpgrade("Capture and Interrogate", "Captures spies and reveals their origin.", "counter_espionage", "Spy Capture", 0.25),
];

const byId = new Map(EMPIRE_UPGRADES.map((u) => [u.id, u]));
export const getEmpireUpgrade = (id) => byId.get(id);

export function isEmpireUpgradeAvailable(upgrade, completedTechIds) {
  const set = completedTechIds instanceof Set ? completedTechIds : new Set(completedTechIds || []);
  return set.has(upgrade.gatingTechId);
}

export function getAvailableEmpireUpgrades(completedTechIds) {
  const set = completedTechIds instanceof Set ? completedTechIds : new Set(completedTechIds || []);
  return EMPIRE_UPGRADES.filter((u) => set.has(u.gatingTechId));
}

export function canPurchaseEmpireUpgrade(upgrade, purchasedUpgradeIds) {
  const purchased = purchasedUpgradeIds instanceof Set ? purchasedUpgradeIds : new Set(purchasedUpgradeIds || []);
  return !purchased.has(upgrade.id);
}
