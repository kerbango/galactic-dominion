// Empire-wide upgrade definitions. Research gates access; players then
// purchase upgrade levels on the Upgrade Page.

const tierCosts = (base, multiplier = 2) => [
  { level: 1, bonus: base, cost: { aetherium_crystal: 300, ferrite_titanium: 600, vrind: 800 } },
  { level: 2, bonus: base * 2, cost: { aetherium_crystal: 800, ferrite_titanium: 1600, vrind: 2000 } },
  { level: 3, bonus: base * 3, cost: { aetherium_crystal: 2000, ferrite_titanium: 4000, vrind: 5000 } },
];

const fixedThree = (name, description, gatingTechId, effectLabel, bonus) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  name,
  description,
  gatingTechId,
  effectLabel,
  tiers: tierCosts(bonus),
});

export const EMPIRE_UPGRADES = [
  fixedThree("Population Growth I", "Increases empire population growth.", "planetary_growth_economics", "Population Growth", 0.05),
  fixedThree("Population Growth II", "Further increases empire population growth.", "planetary_growth_matrix", "Population Growth", 0.05),
  fixedThree("Population Growth III", "Further increases empire population growth.", "imperial_networking", "Population Growth", 0.05),
  fixedThree("Income Upgrade I", "Strictly increases recurring VRIND income.", "economic_optimization", "VRIND Income", 0.05),
  fixedThree("Income Upgrade II", "Strictly increases recurring VRIND income.", "tachyon_communications", "VRIND Income", 0.05),
  fixedThree("Income Upgrade III", "Strictly increases recurring VRIND income.", "imperial_directives", "VRIND Income", 0.05),
  fixedThree("Resource Finder I", "Increases resources found during exploration.", "deep_space_survey_probe", "Resources Found", 0.05),
  fixedThree("Resource Finder II", "Further increases resources found during exploration.", "atmospheric_hazard_cartography", "Resources Found", 0.05),
  fixedThree("Resource Finder III", "Further increases resources found during exploration.", "atmospheric_hazard_cartography", "Resources Found", 0.05),
  fixedThree("Cost Reducer I", "Reduces Exploration Ship energy cost.", "anomaly_analysis_algorithms", "Exploration Energy Cost", -0.05),
  fixedThree("Cost Reducer II", "Further reduces Exploration Ship energy cost.", "warp_lane_optimization", "Exploration Energy Cost", -0.05),
  fixedThree("Exploration Speed I", "Makes exploration 5% faster.", "tachyon_sensor_array", "Exploration Time", -0.05),
  fixedThree("Exploration Speed II", "Makes exploration 10% faster.", "relic_matrices", "Exploration Time", -0.10),
  fixedThree("Exploration Speed III", "Makes exploration 15% faster.", "warp_lane_optimization", "Exploration Time", -0.15),
  fixedThree("Exploration Speed IV", "Makes exploration 20% faster.", "fold_navigation", "Exploration Time", -0.20),
  fixedThree("ECM Field Matrix I", "Provides 33% planetary ECM detection capability.", "advanced_detection_grid", "ECM Detection", 0.33),
  fixedThree("ECM Field Matrix II", "Provides 66% planetary ECM detection capability.", "advanced_detection_grid", "ECM Detection", 0.66),
  fixedThree("ECM Field Matrix III", "Provides 99% planetary ECM detection capability.", "advanced_detection_grid", "ECM Detection", 0.99),
  fixedThree("Empire Defense Control Matrix I", "Increases overall empire defense numbers by 10%.", "planetary_fortress_network", "Empire Defense", 0.10),
  fixedThree("Tax Office I", "Increases VRIND income by 5% per hour.", "resource_dominance", "VRIND Income", 0.05),
  fixedThree("Tax Office II", "Increases VRIND income by 10% per hour.", "resource_dominance", "VRIND Income", 0.10),
  fixedThree("Tax Office III", "Increases VRIND income by 15% per hour.", "resource_dominance", "VRIND Income", 0.15),
  fixedThree("TAX EVASION I", "Completely removes Global Market tax.", "galactic_trade_manipulation_ai", "Global Market Tax", -1.0),
  fixedThree("Alliance Bonus I", "Provides an alliance attack bonus when striking the same enemy.", "war_council", "Alliance Attack", 0.05),
  fixedThree("Alliance Bonus II", "Further increases the alliance attack bonus when striking the same enemy.", "war_council", "Alliance Attack", 0.10),
  fixedThree("Secured Fleet Network I", "Improves protection against hostile scouting.", "empire_data_encryption", "Scout Information Protection", 0.25),
  fixedThree("Secured Fleet Network II", "Further improves protection against hostile scouting.", "empire_data_encryption", "Scout Information Protection", 0.50),
  fixedThree("Anti Spy Network", "Detects hostile spies.", "counter_espionage", "Spy Detection", 0.25),
  fixedThree("Critical Spy Observation", "Hinders hostile spies from reporting complete information.", "counter_espionage", "Spy Disruption", 0.25),
  fixedThree("Capture and Interrogate", "Captures spies and reveals their origin.", "counter_espionage", "Spy Capture", 0.25),
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

export function nextEmpireUpgradeTier(upgrade, level) {
  const next = (level || 0) + 1;
  return upgrade.tiers[next - 1] || null;
}
