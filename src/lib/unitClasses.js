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
};

export const UNIT_CLASSES = [
  'All', 'Scouts', 'Explorers', 'Frigates', 'Destroyers', 'Cruisers', 'Carriers', 'Capital', 'Support',
];

export function unitClass(unit) {
  return CLASS_MAP[unit.id] || 'Support';
}