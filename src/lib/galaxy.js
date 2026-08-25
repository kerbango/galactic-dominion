// Galaxy coordinate-space constants shared by the map view and travel UI.
export const GRID_SIZE = 1000;
export const MIN_DISTANCE = 200;
// Travel speed: 1 grid unit takes this many seconds. Crossing the full galaxy
// (1000 units) therefore takes ~50 minutes; the minimum spawn gap of 200 units
// is ~10 minutes — meaningful enough to matter strategically.
export const TRAVEL_SECONDS_PER_UNIT = 3;

export function distance(a, b) {
  if (a.map_x == null || a.map_y == null || b.map_x == null || b.map_y == null) return null;
  return Math.hypot(a.map_x - b.map_x, a.map_y - b.map_y);
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