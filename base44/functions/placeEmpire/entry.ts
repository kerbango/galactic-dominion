import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { computeSpawn } from '../../shared/spawn.ts';

// Server-side empire founding: validates the name/ruler, reads every existing
// empire's coordinates (as service role, since owner-only RLS hides them from
// the user token), computes a spawn at least MIN_DISTANCE from all rivals,
// then creates the Empire as the requesting user so created_by_id is correct.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const empireName = (body.empire_name || '').toString().trim();
    const rulerName = (body.ruler_name || '').toString().trim();
    if (!empireName || !rulerName) {
      return Response.json({ error: 'Empire name and ruler name are required.' }, { status: 400 });
    }

    const all = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const points = all.filter((e) => e.map_x != null && e.map_y != null);
    const spawn = computeSpawn(points);

    const empire = await base44.entities.Empire.create({
      empire_name: empireName,
      ruler_name: rulerName,
      map_x: spawn.map_x,
      map_y: spawn.map_y,
    });
    return Response.json({ empire });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}