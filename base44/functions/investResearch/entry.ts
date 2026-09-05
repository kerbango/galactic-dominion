import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Manual "Invest Now" — spends the empire's currently available stored RP
// into the single active TechProgress record, up to its remaining effective
// required RP. Does NOT generate RP (no refill); it only moves RP from the
// pool into invested progress. Completion flips the record to 'completed'
// and any unspent RP stays in the pool.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const maxAmount = Number(body?.amount) || 0;

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'No empire found' }, { status: 404 });

    const researching = await base44.entities.TechProgress.filter({ created_by_id: user.id, status: 'researching' });
    if (!researching.length) return Response.json({ error: 'No active research project.' }, { status: 400 });

    const sorted = researching
      .slice()
      .sort((a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime());
    const project = sorted[0];

    const required = Math.max(1, Number(project.research_points_required) || 500);
    const invested = Math.max(0, Number(project.research_points_invested) || 0);
    const remaining = Math.max(0, required - invested);
    if (remaining <= 0) return Response.json({ error: 'Research already complete.' }, { status: 400 });

    const available = Math.max(0, Number(empire.research_points) || 0);
    if (available <= 0) return Response.json({ error: 'No Research Points available to invest.' }, { status: 400 });

    const invest = Math.min(remaining, available, maxAmount > 0 ? maxAmount : available);
    if (invest <= 0) return Response.json({ error: 'Nothing to invest.' }, { status: 400 });

    const nextInvested = invested + invest;
    const complete = nextInvested >= required - 0.000001;

    await base44.entities.TechProgress.update(project.id, {
      research_points_invested: complete ? required : nextInvested,
      progress: complete ? required : nextInvested,
      status: complete ? 'completed' : 'researching',
    });
    await base44.entities.Empire.updateMany({ id: empire.id }, { $inc: { research_points: -invest } });

    const freshEmpire = await base44.entities.Empire.get(empire.id);
    const freshProject = await base44.entities.TechProgress.get(project.id);
    return Response.json({
      empire: freshEmpire,
      record: freshProject,
      invested: invest,
      completed: complete,
      remaining: Math.max(0, required - (complete ? required : nextInvested)),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}