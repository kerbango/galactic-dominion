// Galactic Dominion — canonical technology tree dataset.
// This file is the single source of truth shared by the Research UI and
// backend research functions. Research nodes live here; purchasable Roman
// numeral upgrades belong to the Upgrade Page and are referenced through
// unlocks.upgrades. Exploration Ships I/II are units and therefore remain
// research unlocks rather than upgrades.

export const CATEGORIES = {
  Defense: { icon: "Shield", color: "text-red-300" },
  "Economy and Resources": { icon: "Coins", color: "text-yellow-300" },
  "Fleet Research": { icon: "Rocket", color: "text-cyan-300" },
  Exploration: { icon: "Radar", color: "text-emerald-300" },
  "Empire Governance": { icon: "Crown", color: "text-violet-300" },
};

export const CATEGORY_ORDER = [
  "Defense",
  "Economy and Resources",
  "Fleet Research",
  Exploration,
  "Empire Governance",
];

export const TECH_TREE = [
  // ═══════════════════════════════════════════════════════════════════════
  // DEFENSE
  // ═══════════════════════════════════════════════════════════════════════
  { id: "defense_command", name: "Defense Command", description: "Establishes the empire's formal planetary and fleet defense doctrine.", category: "Defense", icon: "Shield", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlockTags: ["defense"] },
  { id: "planetary_defense_architecture", name: "Planetary Defense Architecture", description: "Creates the framework for layered planetary defense installations.", category: "Defense", tier: 2, researchTurns: 2, prerequisites: ["defense_command"], isPrimary: true, unlocks: { units: ["bunker", "pdg"] }, unlockTags: ["planet_defense"] },
  { id: "fleet_defense_doctrine", name: "Fleet Defense Doctrine", description: "Formalizes defensive fleet formations and capital protection doctrine.", category: "Defense", tier: 2, researchTurns: 2, prerequisites: ["defense_command"], unlockTags: ["fleet_defense"] },
  { id: "early_warning_network", name: "Early Warning Network", description: "Links planetary sensors into an integrated hostile-fleet warning system.", category: "Defense", tier: 3, researchTurns: 3, prerequisites: ["planetary_defense_architecture"], unlockTags: ["detection"] },
  { id: "heavy_battery_systems", name: "Heavy Battery Systems", description: "Unlocks massive planetary battery emplacements designed to engage large warships.", category: "Defense", tier: 3, researchTurns: 3, prerequisites: ["planetary_defense_architecture"], isPrimary: true, unlocks: { units: ["heavy_battery"] }, unlockTags: ["planet_defense"] },
  { id: "point_defense_grid", name: "Point Defense Grid", description: "Layered planetary point-defense weapons protect installations from incoming craft and ordnance.", category: "Defense", tier: 3, researchTurns: 3, prerequisites: ["planetary_defense_architecture"], isPrimary: true, unlocks: { units: ["pdg"] } },
  { id: "shield_coordination", name: "Shield Coordination", description: "Coordinates defensive shield systems across installations and fleet formations.", category: "Defense", tier: 3, researchTurns: 3, prerequisites: ["fleet_defense_doctrine"], unlockTags: ["shields"] },
  { id: "ecm_detection_architecture", name: "ECM Detection Architecture", description: "Creates the detection framework used to resist stealth and electronic concealment.", category: "Defense", tier: 4, researchTurns: 4, prerequisites: ["early_warning_network"], unlockTags: ["ecm_detection"] },
  { id: "fortress_command", name: "Fortress Command", description: "Integrates planetary defenses into a unified command structure.", category: "Defense", tier: 4, researchTurns: 4, prerequisites: ["heavy_battery_systems", "shield_coordination"], unlocks: { buildings: ["fortress_command"] } },
  { id: "advanced_detection_grid", name: "Advanced Detection Grid", description: "Expands the empire's ability to detect concealed fleets before they reach engagement range.", category: "Defense", tier: 5, researchTurns: 5, prerequisites: ["ecm_detection_architecture"], unlocks: { upgrades: ["ECM Field Matrix I", "ECM Field Matrix II", "ECM Field Matrix III"] }, unlockTags: ["ecm_field_matrix"] },
  { id: "planetary_fortress_network", name: "Planetary Fortress Network", description: "The final conventional defense architecture: mutually supporting planetary fortresses and batteries.", category: "Defense", tier: 6, researchTurns: 6, prerequisites: ["fortress_command", "advanced_detection_grid"], isPrimary: true, unlocks: { upgrades: ["Empire Defense Control Matrix I"] } },

  // ═══════════════════════════════════════════════════════════════════════
  // ECONOMY AND RESOURCES
  // ═══════════════════════════════════════════════════════════════════════
  { id: "resource_administration", name: "Resource Administration", description: "Establishes centralized management of imperial production and resources.", category: "Economy and Resources", icon: "Coins", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlockTags: ["economy"] },
  { id: "industrial_expansion", name: "Industrial Expansion", description: "Expands planetary industry and production capacity.", category: "Economy and Resources", tier: 2, researchTurns: 2, prerequisites: ["resource_administration"], unlockTags: ["industry"] },
  { id: "resource_extraction", name: "Advanced Resource Extraction", description: "Improves the empire's ability to extract ferrite-titanium, aetherium crystal and other strategic resources.", category: "Economy and Resources", tier: 2, researchTurns: 2, prerequisites: ["resource_administration"], unlockTags: ["resources"] },
  { id: "vrind_economy", name: "VRIND Economic Systems", description: "Formalizes the empire's VRIND economy and revenue infrastructure.", category: "Economy and Resources", tier: 3, researchTurns: 3, prerequisites: ["resource_administration"], unlockTags: ["vrind"] },
  { id: "planetary_growth_economics", name: "Planetary Growth Economics", description: "Aligns population growth with long-term economic output.", category: "Economy and Resources", tier: 3, researchTurns: 3, prerequisites: ["industrial_expansion"], unlocks: { upgrades: ["Population Growth I", "Population Growth II"] } },
  { id: "advanced_mining_network", name: "Advanced Mining Network", description: "Coordinates extraction operations across planetary and orbital deposits.", category: "Economy and Resources", tier: 3, researchTurns: 3, prerequisites: ["resource_extraction"], unlocks: { upgrades: ["Resource Production I"] } },
  { id: "galactic_trade", name: "Galactic Trade", description: "Opens larger-scale interplanetary and galactic market operations.", category: "Economy and Resources", tier: 4, researchTurns: 4, prerequisites: ["vrind_economy", "advanced_mining_network"], unlockTags: ["galactic_trade"] },
  { id: "economic_optimization", name: "Economic Optimization", description: "Uses advanced planning to increase the empire's recurring VRIND income.", category: "Economy and Resources", tier: 4, researchTurns: 4, prerequisites: ["vrind_economy"], unlocks: { upgrades: ["Income Upgrade I"] } },
  { id: "trade_manipulation", name: "Trade Manipulation", description: "Advanced market systems allow the empire to influence taxation and trade flows.", category: "Economy and Resources", tier: 5, researchTurns: 5, prerequisites: ["galactic_trade", "economic_optimization"], unlockTags: ["trade_manipulation"] },
  { id: "resource_dominance", name: "Resource Dominance", description: "A mature economic network optimized for sustained imperial expansion.", category: "Economy and Resources", tier: 6, researchTurns: 6, prerequisites: ["trade_manipulation", "planetary_growth_economics"], isPrimary: true, unlocks: { upgrades: ["Tax Office I", "Tax Office II", "Tax Office III"] } },

  // ═══════════════════════════════════════════════════════════════════════
  // FLEET RESEARCH
  // ═══════════════════════════════════════════════════════════════════════
  { id: "fleet_foundation", name: "Fleet Foundation", description: "Establishes the research doctrine for military spacecraft and fleet operations.", category: "Fleet Research", icon: "Rocket", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlockTags: ["fleet"] },
  { id: "standard_hull_framing", name: "Standard Hull Framing", description: "Creates the standardized hull architecture used by the empire's fleet yards.", category: "Fleet Research", tier: 2, researchTurns: 2, prerequisites: ["fleet_foundation"], isPrimary: true, unlocks: { units: ["scout_ship", "medium_frigate"] } },
  { id: "jump_drive_attunement", name: "Jump Drive Attunement", description: "Improves jump calculations, transition stability and fleet arrival positioning.", category: "Fleet Research", tier: 2, researchTurns: 2, prerequisites: ["fleet_foundation"], unlockTags: ["jump_drive"] },
  { id: "frigate_design", name: "Frigate Design", description: "Develops specialized light and medium frigate hulls.", category: "Fleet Research", tier: 3, researchTurns: 3, prerequisites: ["standard_hull_framing"], isPrimary: true, unlocks: { units: ["medium_frigate", "heavy_frigate"] } },
  { id: "destroyer_design", name: "Destroyer Design", description: "Develops heavier escort and line-combat hulls.", category: "Fleet Research", tier: 3, researchTurns: 3, prerequisites: ["standard_hull_framing"], isPrimary: true, unlocks: { units: ["destroyer", "heavy_super_destroyer"] } },
  { id: "quantum_computing", name: "Quantum Computing", description: "Advanced computation accelerates future research and fleet-control calculations.", category: "Fleet Research", tier: 3, researchTurns: 3, prerequisites: ["jump_drive_attunement"], unlocks: { abilities: ["research_speed"] } },
  { id: "cruiser_hull", name: "Cruiser Hull Architecture", description: "Creates the first true cruiser-scale combat architecture.", category: "Fleet Research", tier: 4, researchTurns: 4, prerequisites: ["frigate_design", "destroyer_design"], isPrimary: true, unlocks: { units: ["light_cruiser", "medium_cruiser", "heavy_cruiser"] } },
  { id: "carrier_architecture", name: "Carrier Architecture", description: "Develops dedicated carrier systems for fighters, interceptors, drones and support craft.", category: "Fleet Research", tier: 4, researchTurns: 4, prerequisites: ["cruiser_hull"], isPrimary: true, unlocks: { units: ["carrier", "drone_carrier"] } },
  { id: "capital_hull_engineering", name: "Capital Hull Engineering", description: "Allows construction of battleship, dreadnought and battlecruiser-scale hulls.", category: "Fleet Research", tier: 5, researchTurns: 5, prerequisites: ["cruiser_hull"], isPrimary: true, unlocks: { units: ["battleship", "battlecruiser", "dreadnought"] } },
  { id: "fleet_command_network", name: "Fleet Command Network", description: "Links fleets and command ships into a coordinated battlespace network.", category: "Fleet Research", tier: 5, researchTurns: 5, prerequisites: ["quantum_computing", "capital_hull_engineering"], unlockTags: ["fleet_command"] },
  { id: "advanced_fleet_architecture", name: "Advanced Fleet Architecture", description: "Final conventional fleet research before specialized and restricted technologies.", category: "Fleet Research", tier: 6, researchTurns: 6, prerequisites: ["carrier_architecture", "capital_hull_engineering", "fleet_command_network"], isPrimary: true, unlocks: { units: ["titan", "exploration_command_ship"] } },

  // ═══════════════════════════════════════════════════════════════════════
  // EXPLORATION
  // ═══════════════════════════════════════════════════════════════════════
  { id: "long_range_sensors", name: "Long Range Sensors", description: "Detect and analyze distant regions of space.", category: "Exploration", icon: "Radar", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlocks: { units: ["pathfinder_exploration_vessel"] }, unlockTags: ["exploration"] },
  { id: "aero_probe_launcher", name: "Aero-Probe Launcher", description: "Launches autonomous probes into hazardous and poorly mapped regions.", category: "Exploration", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlocks: { units: ["pathfinder_exploration_vessel"] }, unlockTags: ["exploration"] },
  { id: "sub_light_mapping", name: "Sub Light Mapping", description: "Maps local space without requiring full warp transit.", category: "Exploration", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlocks: { units: ["pathfinder_exploration_vessel"] }, unlockTags: ["exploration"] },
  { id: "tachyon_sensor_array", name: "Tachyon Sensor Array", description: "Extends sensor range into regions masked by normal detection limits.", category: "Exploration", tier: 2, researchTurns: 2, prerequisites: ["long_range_sensors"], unlocks: { upgrades: ["Exploration Speed I"] } },
  { id: "deep_space_survey_probe", name: "Deep Space Survey Probe", description: "Deploys durable probes for long-duration resource surveys.", category: "Exploration", tier: 2, researchTurns: 2, prerequisites: ["aero_probe_launcher"], unlocks: { upgrades: ["Resource Finder I"] } },
  { id: "anomaly_analysis_algorithms", name: "Anomaly Analysis Algorithms", description: "Identifies unusual signals, spatial anomalies and ancient sites.", category: "Exploration", tier: 2, researchTurns: 2, prerequisites: ["sub_light_mapping"], unlocks: { upgrades: ["Cost Reducer I"] } },
  { id: "relic_matrices", name: "Relic Matrices", description: "Interprets structures and signals associated with ancient civilizations.", category: "Exploration", tier: 3, researchTurns: 3, prerequisites: ["tachyon_sensor_array"], unlockTags: ["ancient_technology"] },
  { id: "atmospheric_hazard_cartography", name: "Atmospheric Hazard Cartography", description: "Maps hazardous planetary environments and improves the chance of finding ancient lost technology.", category: "Exploration", tier: 3, researchTurns: 3, prerequisites: ["deep_space_survey_probe"], unlocks: { upgrades: ["Resource Finder II", "Resource Finder III"] }, unlockTags: ["ancient_lost_technology"] },
  { id: "warp_lane_optimization", name: "Warp Lane Optimization", description: "Optimizes exploration routes and reduces travel time.", category: "Exploration", tier: 3, researchTurns: 3, prerequisites: ["anomaly_analysis_algorithms"], unlocks: { upgrades: ["Cost Reducer II", "Exploration Speed III"] } },
  { id: "study_ancient_languages", name: "Study Ancient Languages", description: "Deciphers ancient language systems and permits communication with visiting alien traders once the Travel Trade Center exists.", category: "Exploration", tier: 4, researchTurns: 4, prerequisites: ["relic_matrices"], unlockTags: ["alien_trade_language"] },
  { id: "subspace_beacon_network", name: "Subspace Beacon Network", description: "Creates navigational beacons for deeper exploration missions.", category: "Exploration", tier: 4, researchTurns: 4, prerequisites: ["relic_matrices"], unlocks: { units: ["wayfinder_exploration_vessel"] } },
  { id: "fold_navigation", name: "Fold Navigation", description: "Mastery of folded-space navigation completes the conventional exploration program.", category: "Exploration", tier: 5, researchTurns: 5, prerequisites: ["warp_lane_optimization"], unlocks: { upgrades: ["Exploration Speed IV"] } },
  { id: "relic_adhesion_matrix_ai", name: "Relic Adhesion Matrix AI", description: "A dangerous artificial intelligence that reconstructs and integrates ancient technology. This is one half of the gate to Blacklisted Alien Technology.", category: "Exploration", tier: 6, researchTurns: 6, prerequisites: ["subspace_beacon_network", "fold_navigation", "study_ancient_languages"], isPrimary: true, unlockTags: ["blacklisted_gate"] },

  // ═══════════════════════════════════════════════════════════════════════
  // EMPIRE GOVERNANCE
  // ═══════════════════════════════════════════════════════════════════════
  { id: "centralized_administration", name: "Centralized Administration", description: "Concentrates imperial administration into a unified governing structure.", category: "Empire Governance", icon: "Crown", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlockTags: ["governance"] },
  { id: "sub_space_relays", name: "Sub-space Relays", description: "Establishes the communication backbone for the empire.", category: "Empire Governance", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlockTags: ["governance"] },
  { id: "standardized_empire_codes", name: "Standardized Empire Codes", description: "Creates common legal and administrative standards throughout the empire.", category: "Empire Governance", tier: 1, researchTurns: 1, prerequisites: [], isPrimary: true, unlockTags: ["governance"] },
  { id: "planetary_growth_matrix", name: "Planetary Growth Matrix", description: "Coordinates planetary population and development policy.", category: "Empire Governance", tier: 2, researchTurns: 2, prerequisites: ["centralized_administration"], unlocks: { upgrades: ["Population Growth II"] } },
  { id: "tachyon_communications", name: "Tachyon Communications", description: "High-speed communications strengthen economic coordination and increase VRIND income.", category: "Empire Governance", tier: 2, researchTurns: 2, prerequisites: ["sub_space_relays"], unlocks: { upgrades: ["Income Upgrade II"] } },
  { id: "imperial_directives", name: "Imperial Directives", description: "Central directives increase imperial economic efficiency and VRIND income.", category: "Empire Governance", tier: 2, researchTurns: 2, prerequisites: ["standardized_empire_codes"], unlocks: { upgrades: ["Income Upgrade III"] } },
  { id: "imperial_networking", name: "Imperial Networking", description: "Links administrative centers across the empire.", category: "Empire Governance", tier: 3, researchTurns: 3, prerequisites: ["planetary_growth_matrix"], unlocks: { upgrades: ["Population Growth III"] } },
  { id: "quantum_entanglement_command_matrix", name: "Quantum Entanglement Command Matrix", description: "Instant command and communication across imperial distances.", category: "Empire Governance", tier: 3, researchTurns: 3, prerequisites: ["tachyon_communications"], unlocks: { upgrades: ["0 COMM FEE"] }, unlockTags: ["global_comms"] },
  { id: "diplomatic_decree", name: "Diplomatic Decree", description: "Creates the legal authority for formal alliances.", category: "Empire Governance", tier: 3, researchTurns: 3, prerequisites: ["imperial_directives"], unlocks: { abilities: ["alliance_creation"] } },
  { id: "empire_data_encryption", name: "Empire Data Encryption", description: "Protects imperial intelligence from hostile reconnaissance and scout information gathering.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["imperial_networking"], unlocks: { upgrades: ["Secured Fleet Network I", "Secured Fleet Network II"] } },
  { id: "centralized_command_matrix", name: "Centralized Command Matrix", description: "Unifies defensive command and improves the empire's overall defensive strength.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["imperial_networking"], unlocks: { upgrades: ["Empire Defense Control Matrix I"] } },
  { id: "sub_space_data_networks", name: "Sub-space Data Networks", description: "Creates the next generation of secure imperial data routing.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["imperial_networking"], unlockTags: ["data_networks"] },
  { id: "galactic_trade_manipulation_ai", name: "Galactic Trade Manipulation AI", description: "An economic AI capable of manipulating market taxation systems.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["quantum_entanglement_command_matrix"], unlocks: { upgrades: ["TAX EVASION I"] } },
  { id: "travel_trade_ambassador", name: "Travel Trade Ambassador", description: "Establishes the diplomatic authority for an Alien Travel Trade Center.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["quantum_entanglement_command_matrix"], unlocks: { buildings: ["alien_travel_trade_center"] } },
  { id: "empire_control_overlord", name: "Empire Control OVERLORD", description: "Places emergency imperial authority under a single command structure. Also forms the second half of the gate to Blacklisted Alien Technology.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["quantum_entanglement_command_matrix"], isPrimary: true, unlocks: { abilities: ["martial_law"] }, unlockTags: ["blacklisted_gate"] },
  { id: "espionage", name: "Espionage", description: "Unlocks the Espionage operations system.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["diplomatic_decree"], unlocks: { abilities: ["espionage"] } },
  { id: "counter_espionage", name: "Counter Espionage", description: "Develops systems for detecting, hindering and capturing hostile spies.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["diplomatic_decree"], unlocks: { upgrades: ["Anti Spy Network", "Critical Spy Observation", "Capture and Interrogate"] } },
  { id: "war_council", name: "War Council", description: "Formalizes allied military coordination against common enemies.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["diplomatic_decree"], unlocks: { upgrades: ["Alliance Bonus I", "Alliance Bonus II"] } },
  { id: "taxation_doctrine", name: "Taxation Doctrine", description: "Creates formal imperial taxation policy and recurring VRIND revenue bonuses.", category: "Empire Governance", tier: 4, researchTurns: 4, prerequisites: ["diplomatic_decree"], unlocks: { upgrades: ["Tax Office I", "Tax Office II", "Tax Office III"] } },
  { id: "governance_apex", name: "Imperial Governance Apex", description: "The mature governance framework that coordinates communications, defense, trade, diplomacy and intelligence.", category: "Empire Governance", tier: 5, researchTurns: 5, prerequisites: ["empire_data_encryption", "centralized_command_matrix", "galactic_trade_manipulation_ai", "empire_control_overlord", "counter_espionage", "war_council", "taxation_doctrine"], isPrimary: true, unlockTags: ["governance_apex"] },
];

// Normalize prerequisite declarations. Arrays mean AND prerequisites.
// Objects may specify both all and any groups.
export function normalizePrereqs(tech) {
  if (!tech) return { all: [], any: [] };
  if (Array.isArray(tech.prerequisites)) return { all: tech.prerequisites, any: [] };
  const p = tech.prerequisites || {};
  return { all: p.all || [], any: p.any || [] };
}

// Default research cost scales by tier while allowing individual techs to
// override it with `researchCost`.
export function defaultResearchCost(tier) {
  const t = Math.max(1, Number(tier) || 1);
  return {
    research_points: 20 * (2 ** (t - 1)),
    vrind: 40 * (2 ** (t - 1)),
  };
}

export function getResearchCost(tech) {
  return tech?.researchCost || defaultResearchCost(tech?.tier);
}

// Primary nodes are rendered larger by the existing canvas. Explicit flags
// take precedence; tier 1 roots are primary by default.
export function isPrimaryTech(tech) {
  return tech?.isPrimary === true || (!Object.prototype.hasOwnProperty.call(tech || {}, "isPrimary") && tech?.tier === 1);
}

export function getUnlocks(tech) {
  return tech?.unlocks || {};
}
