// Galaxy coordinate-space constants shared by the map view and travel UI.
export const GRID_SIZE = 3000;
export const MIN_DISTANCE = 200;
// Travel speed: 1 grid unit takes this many seconds. Crossing the full galaxy
// (1000 units) takes ~133 minutes; the minimum spawn gap of 200 units is ~27
// minutes — meaningful enough to matter strategically.
export const TRAVEL_SECONDS_PER_UNIT = 8;

export function distance(a, b) {
  if (a.map_x == null || a.map_y == null || b.map_x == null || b.map_y == null) return null;
  return Math.hypot(a.map_x - b.map_x, a.map_y - b.map_y);
}

// Display conversion: 5 grid units == 1 light-year. Used only for the
// human-readable distance shown on the map; travel time still uses raw units.
export function lightYears(units) {
  if (units == null) return null;
  return units / 5;
}

export function travelSeconds(units) {
  if (units == null) return null;
  return Math.round(units * TRAVEL_SECONDS_PER_UNIT);
}

export function formatDuration(totalSeconds) {
  if (totalSeconds == null) return '—';
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// --- Fleet movement helpers ----------------------------------------------
// Fleets store origin/target grid coords plus departure/arrival timestamps.
// These derive live position and remaining time from the current clock `now`
// (epoch ms), so the map can animate in-transit fleets without polling.

// A fleet is a round trip: an outbound leg (home → target) then a return
// leg (target → home). These helpers read the *active* leg's coordinate
// pair and timestamps so the map animates the dot in the right direction
// and the countdown matches the right timer.
const isReturnLeg = (fleet) => fleet.leg === 'return';

export function fleetProgress(fleet, now) {
  const returning = isReturnLeg(fleet);
  const dep = new Date(returning ? fleet.return_departure_date : fleet.departure_date).getTime();
  const arr = new Date(returning ? fleet.return_arrival_date : fleet.arrival_date).getTime();
  if (!dep || !arr || arr <= dep) return returning ? 1 : 0;
  return Math.max(0, Math.min(1, (now - dep) / (arr - dep)));
}

export function fleetPosition(fleet, now) {
  const p = fleetProgress(fleet, now);
  const returning = isReturnLeg(fleet);
  const fromX = returning ? fleet.target_x : fleet.origin_x;
  const fromY = returning ? fleet.target_y : fleet.origin_y;
  const toX = returning ? fleet.origin_x : fleet.target_x;
  const toY = returning ? fleet.origin_y : fleet.target_y;
  return { x: fromX + (toX - fromX) * p, y: fromY + (toY - fromY) * p };
}

export function remainingSeconds(fleet, now) {
  const returning = isReturnLeg(fleet);
  const arr = new Date(returning ? fleet.return_arrival_date : fleet.arrival_date).getTime();
  if (!arr) return 0;
  return Math.max(0, Math.round((arr - now) / 1000));
}