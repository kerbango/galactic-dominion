// Shared galaxy spawn-placement logic. Imported by getGalacticMap (to preview
// the next spawn) and placeEmpire (to actually create empires), so the
// distance rules live in exactly one place.

export const GRID_SIZE = 3000;
export const MARGIN = 60;
export const MIN_DISTANCE = 200; // ~27 min travel at TRAVEL_SECONDS_PER_UNIT=8
export const MAX_ATTEMPTS = 400;

const rand = (min, max) => Math.random() * (max - min) + min;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// Pick a random in-bounds coordinate at least MIN_DISTANCE from every existing
// empire, so travel between players is always meaningful. Falls back to the
// candidate that maximizes the minimum distance to any neighbour.
export function computeSpawn(points) {
  const inBounds = points.filter((p) => p.map_x != null && p.map_y != null);
  if (!inBounds.length) {
    return {
      map_x: Math.round(rand(MARGIN, GRID_SIZE - MARGIN)),
      map_y: Math.round(rand(MARGIN, GRID_SIZE - MARGIN)),
    };
  }
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const x = rand(MARGIN, GRID_SIZE - MARGIN);
    const y = rand(MARGIN, GRID_SIZE - MARGIN);
    let ok = true;
    for (const p of inBounds) {
      if (dist(x, y, p.map_x, p.map_y) < MIN_DISTANCE) { ok = false; break; }
    }
    if (ok) return { map_x: Math.round(x), map_y: Math.round(y) };
  }
  let best = null;
  let bestD = -1;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const x = rand(MARGIN, GRID_SIZE - MARGIN);
    const y = rand(MARGIN, GRID_SIZE - MARGIN);
    let md = Infinity;
    for (const p of inBounds) md = Math.min(md, dist(x, y, p.map_x, p.map_y));
    if (md > bestD) { bestD = md; best = { map_x: Math.round(x), map_y: Math.round(y) }; }
  }
  return best;
}