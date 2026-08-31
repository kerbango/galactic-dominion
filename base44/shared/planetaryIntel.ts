import { getUnit } from './units.ts';
import { computePlanetDefenseRating } from './planetDefense.ts';

export const INTEL_RANK = { light: 1, medium: 2, heavy: 3 };
export const SCOUT_UNITS = { light_scout: 'light', medium_scout: 'medium', heavy_scout: 'heavy' };

export async function collectSystemIntel(svc, target, level) {
  const rank = INTEL_RANK[level] || 0;
  const report = {
    resources: {
      aetherium_crystal: target.aetherium_crystal || 0,
      ferrite_titanium: target.ferrite_titanium || 0,
      energy: target.energy || 0,
      vrind: target.vrind || 0,
      berentium: target.berentium || 0,
      research_points: target.research_points || 0,
    },
  };
  if (rank < 2) return report;
  const units = await svc.entities.Unit.filter({ created_by_id: target.created_by_id });
  report.population = target.population || 0;
  report.defense_strength = computePlanetDefenseRating(target, units);
  if (rank < 3) return report;
  report.stationed_fleets = units.filter((u) => {
    const def = getUnit(u.unit_type);
    return (u.owned_count || 0) > 0 && def?.category !== 'ground' && def?.category !== 'defense';
  }).map((u) => ({ unit_type: u.unit_type, name: getUnit(u.unit_type)?.name || u.unit_type, count: u.owned_count }));
  report.orbital_defenses = units.filter((u) => (u.owned_count || 0) > 0 && getUnit(u.unit_type)?.category === 'defense')
    .map((u) => ({ unit_type: u.unit_type, name: getUnit(u.unit_type)?.name || u.unit_type, count: u.owned_count }));
  const fleets = await svc.entities.Fleet.list('-created_date', 1000);
  report.active_operations = fleets.filter((f) =>
    (f.status === 'in_transit' || f.status === 'in_battle') &&
    (f.created_by_id === target.created_by_id || f.target_empire_id === target.id)
  ).map((f) => ({
    direction: f.created_by_id === target.created_by_id ? 'outbound' : 'incoming',
    status: f.status,
    fleet_size: f.fleet_size || 0,
    system_name: f.created_by_id === target.created_by_id ? f.target_empire_name : f.origin_empire_name,
  }));
  return report;
}