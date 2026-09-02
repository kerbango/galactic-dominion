import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Purchases the one-time Parallel Research upgrade. It increases the
// player's research concurrency from one technology to two.
const COST = { vrind: 10000 };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    if ((empire.parallel_research_level || 0) >= 1) {
      return Response.json({ error: 'Parallel Research is already purchased.' }, { status: 400 });
    }

    if ((empire.vrind || 0) < COST.vrind) {
      return Response.json({ error: 'Not enough resources for this upgrade.' }, { status: 400 });
    }

    await svc.entities.Empire.update(empire.id, {
      vrind: (empire.vrind || 0) - COST.vrind,
      parallel_research_level: 1,
    });

    const fresh = await svc.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, level: 1, researchSlots: 2, cost: COST });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}