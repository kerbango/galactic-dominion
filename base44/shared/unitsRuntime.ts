// Runtime unit view used while the authored unit catalog is being reconciled
// with the research tree. The canonical units.ts remains the source dataset.
import { UNITS as BASE_UNITS } from './units.ts';

const GATE_OVERRIDES = {
  carrier: 'carrier_architecture',
  light_scout: 'standard_hull_framing',
  medium_scout: 'standard_hull_framing',
  heavy_scout: 'standard_hull_framing',
  stealth_boat: 'standard_hull_framing',
  light_frigate: 'standard_hull_framing',
  medium_frigate: 'frigate_design',
  heavy_frigate: 'frigate_design',
  light_destroyer: 'destroyer_design',
  heavy_destroyer: 'destroyer_design',
  phalanx_destroyer: 'destroyer_design',
  light_cruiser: 'cruiser_hull',
  battle_cruiser: 'capital_hull_engineering',
  drone_carrier: 'carrier_architecture',
  Dreadnaught: 'capital_hull_engineering',
  quantum_jumpcarrier: 'advanced_fleet_architecture',
  void_siphon: 'void_siphon_engine',
  vampiric_shieldship: 'vampiric_field_generator',
  phase_scout: 'phasing_hull_matrix',
  living_frigate: 'relic_adhesion_matrix_ai',
  bunker: 'planetary_defense_architecture',
  pdg: 'point_defense_grid',
  heavy_battery: 'heavy_battery_systems',
  ground_ion_cannon: 'early_warning_network',
  orbit_defense_platform: 'fortress_command',
};

const ANY_GATE_OVERRIDES = {
  light_explorer: ['long_range_sensors', 'aero_probe_launcher', 'sub_light_mapping'],
};

const BLACKLISTED_UNITS = [
  ['entropy_destroyer', 'Entropy Destroyer', 'Heavy blacklisted warship built around cascading entropy weaponry.', 'entropic_cascade_reactor', 4, 82, 55, 15, 15, 70, 70, 38, 70, 55],
  ['vampiric_guardian', 'Vampiric Guardian', 'Blacklisted guardian vessel that transfers defensive energy through resonance.', 'vampiric_resonance_core', 4, 65, 85, 10, 10, 85, 60, 30, 55, 70],
  ['phase_interceptor', 'Phase Interceptor', 'Forbidden interceptor using controlled quantum phase transit.', 'quantum_phase_lattice', 3, 70, 35, 88, 20, 30, 25, 70, 65, 55],
  ['nullifier_ship', 'Nullifier Ship', 'Dedicated support vessel designed to suppress enemy detection signatures.', 'quantum_nullification_field', 3, 35, 60, 75, 15, 55, 45, 35, 65, 75],
  ['entropy_reaper', 'Entropy Reaper', 'Blacklisted capital ship carrying a singularity-scale entropy weapon.', 'entropy_singularity_engine', 6, 98, 65, 5, 5, 65, 92, 15, 88, 35],
  ['vampiric_leviathan', 'Vampiric Leviathan', 'Blacklisted capital ship built around singularity-scale energy drain.', 'vampiric_singularity_matrix', 6, 70, 98, 5, 5, 98, 90, 12, 75, 85],
  ['phase_dreadnought', 'Phase Dreadnought', 'Forbidden capital ship with permanent phase architecture; it remains detectable.', 'phase_singularity_drive', 6, 92, 82, 25, 5, 85, 94, 18, 82, 45],
  ['null_star', 'Null Star', 'Blacklisted support ship built around a quantum-null matrix.', 'quantum_null_matrix', 5, 45, 72, 95, 10, 60, 55, 22, 75, 90],
].map(([id, name, description, gatingTechId, buildTurns, attack, defense, stealth, exploration, shielding, hull_armor, speed, range, efficiency]) => ({
  id, name, description, gatingTechId, buildTurns,
  buildCost: { ferrite_titanium: 150 * buildTurns, aetherium_crystal: 75 * buildTurns, energy: 100 * buildTurns, vrind: 150 * buildTurns },
  baseStats: { attack, defense, stealth, exploration, shielding, hull_armor, speed, range, efficiency },
  unlockTags: ['blacklisted', 'unstable'],
}));

export const UNITS = [
  ...BASE_UNITS.map((unit) => {
    const next = { ...unit };
    if (GATE_OVERRIDES[next.id]) next.gatingTechId = GATE_OVERRIDES[next.id];
    if (ANY_GATE_OVERRIDES[next.id]) next.gatingTechIdsAny = ANY_GATE_OVERRIDES[next.id];
    if (next.id === 'light_explorer') {
      next.name = 'Pathfinder-Class Exploration Vessel';
      next.description = 'Non-combat exploration vessel sent to a selected region to search for resources and ancient technology.';
    }
    if (next.id === 'heavy_explorer') {
      next.name = 'Wayfinder-Class Exploration Vessel';
      next.gatingTechId = 'subspace_beacon_network';
      next.description = 'Advanced non-combat exploration vessel capable of deep-space exploration and ancient-technology discovery.';
    }
    return next;
  }),
  ...BLACKLISTED_UNITS,
];

const UNIT_MAP = new Map(UNITS.map((unit) => [unit.id, unit]));
export function getUnit(id) { return UNIT_MAP.get(id); }
export function isUnitUnlocked(unit, completedIds) {
  if (!unit) return false;
  const completed = completedIds instanceof Set ? completedIds : new Set(completedIds || []);
  if (unit.gatingTechIdsAny?.length) return unit.gatingTechIdsAny.some((id) => completed.has(id));
  if (!unit.gatingTechId) return true;
  return completed.has(unit.gatingTechId);
}
export function getUnlockedUnits(completedIds) { return UNITS.filter((unit) => isUnitUnlocked(unit, completedIds)); }
export { BASE_UNITS };