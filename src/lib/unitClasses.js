// Ship class grouping for the Military roster filter. Derived from unit id
// so the dataset stays the single source of truth; this map only drives UI
// filtering and labels.

const CLASS_MAP = {
  light_scout: 'Scouts', medium_scout: 'Scouts', heavy_scout: 'Scouts', phase_scout: 'Scouts',
  light_explorer: 'Explorers', heavy_explorer: 'Explorers',
  light_frigate: 'Frigates', medium_frigate: 'Frigates', heavy_frigate: 'Frigates', living_frigate: 'Frigates',
  light_destroyer: 'Destroyers', heavy_destroyer: 'Destroyers', phalanx_destroyer: 'Destroyers',
  light_cruiser: 'Cruisers', battle_cruiser: 'Cruisers',
  carrier: 'Carriers', drone_carrier: 'Carriers', quantum_jumpcarrier: 'Carriers',
  Dreadnaught: 'Capital',
  stealth_boat: 'Support', void_siphon: 'Support', vampiric_shieldship: 'Support', bullk_frieghter: 'Support',
  troop_transport: 'Transport',
  infantry: 'Ground Forces', heavy_infantry: 'Ground Forces', assault_infantry: 'Ground Forces',
  mechanized_infantry: 'Ground Forces', mecha: 'Ground Forces',
  bunker: 'Defense', pdg: 'Defense', ground_ion_cannon: 'Defense', orbit_defense_platform: 'Defense', heavy_battery: 'Defense',
};

export const UNIT_CLASSES = [
  'All', 'Scouts', 'Explorers', 'Frigates', 'Destroyers', 'Cruisers', 'Carriers', 'Capital', 'Support',
  'Ground Forces', 'Transport', 'Defense',
];

export function unitClass(unit) {
  return CLASS_MAP[unit.id] || 'Support';
}

// Display-only labels for the shipyard UI. Not used by any game logic.
const CLASS_DISPLAY = {
  Scouts: 'Scout-Class', Explorers: 'Explorer-Class', Frigates: 'Frigate-Class',
  Destroyers: 'Destroyer-Class', Cruisers: 'Cruiser-Class', Carriers: 'Carrier-Class',
  Capital: 'Capital-Class', Support: 'Support-Class', 'Ground Forces': 'Ground Forces',
  Transport: 'Transport-Class', Defense: 'Planetary Defense',
};

const ROLE_MAP = {
  Scouts: 'Reconnaissance', Explorers: 'Deep Space Exploration', Frigates: 'Escort Patrol',
  Destroyers: 'Hunter-Killer', Cruisers: 'Capital Screen', Carriers: 'Strike Craft Operations',
  Capital: 'Capital Warship', Support: 'Fleet Support', 'Ground Forces': 'Planetary Assault',
  Transport: 'Troop Transport', Defense: 'Planetary Defense',
};

export function unitClassLabel(unit) {
  return CLASS_DISPLAY[unitClass(unit)] || 'Support-Class';
}

export function unitRole(unit) {
  return ROLE_MAP[unitClass(unit)] || 'Fleet Support';
}