import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const RESOURCES = ['berentium', 'ferrite_titanium', 'aetherium_crystal', 'energy', 'vrind', 'population'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Overlord access required.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.target_user_id;
    const resourceKey = body.resource_key;
    const amount = Number(body.amount);
    if (!targetUserId || !RESOURCES.includes(resourceKey)) {
      return Response.json({ error: 'Choose a player and resource.' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: 'Enter a positive grant amount.' }, { status: 400 });
    }

    const empires = await base44.asServiceRole.entities.Empire.filter({ created_by_id: targetUserId });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'That player has not founded an empire yet.' }, { status: 404 });

    const updated = await base44.asServiceRole.entities.Empire.update(empire.id, {
      [resourceKey]: (empire[resourceKey] || 0) + amount,
    });
    return Response.json({ ok: true, empire: updated, resource_key: resourceKey, amount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}