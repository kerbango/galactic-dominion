import { getUnit } from './units.ts';
import { computePlanetDefenseRating } from './planetDefense.ts';

export const INTEL_RANK = { light: 1, medium: 2, heavy: 3 };
export const SCOUT_UNITS = { light_scout: 'light', medium_scout: 'medium', heavy_scout: 'heavy' };

// TEMPORARY TESTING OVERRIDE: scout travel speed (matches dispatchFleet/processFleets).
export const SCOUT_TRAVEL_SECONDS_PER_UNIT = 0.5;

// Recon scan duration per scout class (seconds). The scout must remain at the
// target for this duration before intelligence is collected.
export const RECON_DURATION = { light: 10, medium: 15, heavy: 20 };

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

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
    ['in_transit', 'in_battle', 'awaiting_recon', 'scouting'].includes(f.status) &&
    (f.created_by_id === target.created_by_id || f.target_empire_id === target.id)
  ).map((f) => ({
    direction: f.created_by_id === target.created_by_id ? 'outbound' : 'incoming',
    status: f.status,
    fleet_size: f.fleet_size || 0,
    system_name: f.created_by_id === target.created_by_id ? f.target_empire_name : f.origin_empire_name,
  }));
  return report;
}

// Collects intelligence for a completed scout recon and starts the return leg.
// Used by both the client-triggered completeRecon function and the
// processFleets fallback tick.
export async function resolveScoutRecon(svc, fleet, target, now, nowIso) {
  if (!target || !INTEL_RANK[fleet.scout_class]) return;
  const report = await collectSystemIntel(svc, target, fleet.scout_class);
  const found = await svc.entities.PlanetaryIntelligence.filter({ created_by_id: fleet.created_by_id, target_empire_id: target.id });
  const existing = found[0];
  const level = existing && INTEL_RANK[existing.intelligence_level] > INTEL_RANK[fleet.scout_class] ? existing.intelligence_level : fleet.scout_class;
  const intelData = { target_empire_id: target.id, target_empire_name: target.empire_name, intelligence_level: level, last_scouted_date: nowIso, ...report };
  if (existing) await svc.entities.PlanetaryIntelligence.update(existing.id, intelData);
  else await svc.entities.PlanetaryIntelligence.create({ ...intelData, created_by_id: fleet.created_by_id });
  const travelMs = Math.round(dist(fleet.origin_x, fleet.origin_y, fleet.target_x, fleet.target_y) * SCOUT_TRAVEL_SECONDS_PER_UNIT) * 1000;
  await svc.entities.Fleet.update(fleet.id, { status: 'in_transit', leg: 'return', survivors: 1, return_departure_date: nowIso, return_arrival_date: new Date(now + travelMs).toISOString() });
}