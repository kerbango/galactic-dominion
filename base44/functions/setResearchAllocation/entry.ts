import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allocationTotal, normalizeAllocation } from '../../shared/researchAllocation.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const techId = body?.tech_id;
    const allocation = normalizeAllocation(body?.allocation_percent);
    if (!techId) return Response.json({ error: 'tech_id is required' }, { status: 400 });

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    const records = await base44.entities.TechProgress.filter({ created_by_id: user.id });
    const record = records.find((r) => r.tech_id === techId && r.status === 'researching');
    if (!record) return Response.json({ error: 'This technology is not currently being researched.' }, { status: 400 });

    const usedElsewhere = allocationTotal(records, record.id);
    if (usedElsewhere + allocation > 100.0001) {
      return Response.json({
        error: `Research allocation cannot exceed 100%. ${Math.max(0, 100 - usedElsewhere).toFixed(1)}% remains available.`,
      }, { status: 400 });
    }

    const updated = await base44.entities.TechProgress.update(record.id, {
      allocation_percent: Number(allocation.toFixed(2)),
    });
    return Response.json({ ok: true, record: updated, allocation_used: usedElsewhere + allocation, allocation_remaining: Math.max(0, 100 - usedElsewhere - allocation) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
