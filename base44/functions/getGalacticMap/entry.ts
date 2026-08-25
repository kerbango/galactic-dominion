import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GRID_SIZE = 3000;
const MIN_DISTANCE = 200;
const MARGIN = 60;
const MAX_ATTEMPTS = 400;

const rand = (min, max) => Math.random() * (max - min) + min;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// Pick a random coordinate that is at least MIN_DISTANCE from every existing
// empire, so travel between players is always meaningful. Falls back to the
// candidate that maximizes the minimum distance to any neighbour.
function computeSpawn(points) {
  const inBounds = points.filter((p) => p.map_x != null && p.map_y != null);
  if (!inBounds.length) {
    return { map_x: Math.round(rand(MARGIN, GRID_SIZE - MARGIN)), map_y: Math.round(rand(MARGIN, GRID_SIZE - MARGIN)) };
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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Public map data for every empire — owner-only RLS hides full records, so
    // we read as service role and expose only coordinate + identity fields.
    const all = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const points = all.filter((e) => e.map_x != null && e.map_y != null);
    const empires = all.map((e) => ({
      id: e.id,
      empire_name: e.empire_name,
      ruler_name: e.ruler_name,
      map_x: e.map_x,
      map_y: e.map_y,
      created_by_id: e.created_by_id,
    }));
    return Response.json({ empires, nextSpawn: computeSpawn(points) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}