// Runtime unit view used while the authored unit catalog is being reconciled
// with the research tree. The canonical units.ts remains the source dataset;
// this layer only fixes research gates and the two exploration-vessel names.
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
};

const ANY_GATE_OVERRIDES = {
  light_explorer: ['long_range_sensors', 'aero_probe_launcher', 'sub_light_mapping'],
};

export const UNITS = BASE_UNITS.map((unit) => {
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
});

const UNIT_MAP = new Map(UNITS.map((unit) => [unit.id, unit]));

export function getUnit(id) {
  return UNIT_MAP.get(id);
}

export function isUnitUnlocked(unit, completedIds) {
  if (!unit) return false;
  const completed = completedIds instanceof Set ? completedIds : new Set(completedIds || []);
  if (unit.gatingTechIdsAny?.length) return unit.gatingTechIdsAny.some((id) => completed.has(id));
  if (!unit.gatingTechId) return true;
  return completed.has(unit.gatingTechId);
}

export function getUnlockedUnits(completedIds) {
  return UNITS.filter((unit) => isUnitUnlocked(unit, completedIds));
}

export { BASE_UNITS };
