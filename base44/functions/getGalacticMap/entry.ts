import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { computeSpawn } from '../../shared/spawn.ts';

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
      map_x: e.map_x,
      map_y: e.map_y,
      created_by_id: e.created_by_id,
    }));
    return Response.json({ empires, nextSpawn: computeSpawn(points) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}