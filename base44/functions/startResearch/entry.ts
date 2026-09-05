import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { TECH_TREE, normalizePrereqs, getResearchCost } from '../../shared/techTreeRuntime.ts';
import { totalResearchSpeedBonus } from '../../shared/researchSpeed.ts';
import { effectiveRequiredFromBase } from '../../shared/researchPoints.ts';

// Starts a research project. Each technology has a fixed Research Point cost
// (stored as research_points_required). The empire generates RP per hour from
// population and research-speed bonuses; that output is applied to the single
// active research project by the production tick. Only ONE technology may be
// researched at a time. A VRIND commit cost is charged up front; prerequisites
// must be met. Research Points are not spent up front — they accumulate as
// invested progress via the tick.
const techById = new Map(TECH_TREE.map((t) => [t.id, t]));
const START_COST_RESOURCES = ['vrind'];

function isPrerequisiteSatisfied(techId, doneIds, visiting = new Set()) {
  if (doneIds.has(techId)) return true;
  const prerequisite = techById.get(techId);
  if (!prerequisite?.isGate) return false;
  if (visiting.has(techId)) return false;
  visiting.add(techId);
  const { all, any } = normalizePrereqs(prerequisite);
  const allMet = all.every((id) => isPrerequisiteSatisfied(id, doneIds, visiting));
  const anyMet = any.length === 0 || any.some((id) => isPrerequisiteSatisfied(id, doneIds, visiting));
  visiting.delete(techId);
  return allMet && anyMet;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const techId = body?.tech_id;
    if (!techId) return Response.json({ error: 'tech_id is required' }, { status: 400 });

    const tech = techById.get(techId);
    if (!tech) return Response.json({ error: 'Unknown technology.' }, { status: 400 });
    if (tech.isGate) return Response.json({ error: 'This technology is a gate and unlocks automatically when its prerequisites are completed.' }, { status: 400 });

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire before researching.' }, { status: 400 });

    const mine = await base44.entities.TechProgress.filter({ created_by_id: user.id });
    if (mine.some((r) => r.tech_id === techId && r.status === 'completed')) {
      return Response.json({ error: 'Technology already completed.' }, { status: 400 });
    }
    if (mine.some((r) => r.tech_id === techId && r.status === 'researching')) {
      return Response.json({ error: 'Already researching this technology.' }, { status: 400 });
    }
    if (mine.some((r) => r.status === 'researching')) {
      return Response.json({ error: 'You already have an active research project. Complete it before starting another.' }, { status: 400 });
    }

    const { all, any } = normalizePrereqs(tech);
    if (all.length || any.length) {
      const doneIds = new Set(mine.filter((r) => r.status === 'completed').map((r) => r.tech_id));
      const missingAll = all.filter((p) => !isPrerequisiteSatisfied(p, doneIds));
      const anyMet = any.length === 0 || any.some((p) => isPrerequisiteSatisfied(p, doneIds));
      if (missingAll.length || !anyMet) return Response.json({ error: 'Prerequisites not met.' }, { status: 400 });
    }

    const cost = getResearchCost(tech);
    const updates = {};
    for (const res of START_COST_RESOURCES) {
      const c = cost[res] || 0;
      if (c > 0) {
        if ((empire[res] || 0) < c) return Response.json({ error: 'Not enough resources to begin this research.' }, { status: 400 });
        updates[res] = (empire[res] || 0) - c;
      }
    }
    if (Object.keys(updates).length) await base44.entities.Empire.update(empire.id, updates);

    const doneIds = new Set(mine.filter((r) => r.status === 'completed').map((r) => r.tech_id));
    const speedBonus = totalResearchSpeedBonus(doneIds, empire.research_speed_level || 0);
    const baseRp = Math.max(1, Number(cost.research_points) || 500);
    const effectiveRp = effectiveRequiredFromBase(baseRp, speedBonus);

    const record = await base44.entities.TechProgress.create({
      tech_id: techId,
      status: 'researching',
      progress: 0,
      research_turns: tech.researchTurns,
      start_date: new Date().toISOString(),
      research_points_required: effectiveRp,
      research_points_invested: 0,
      allocation_percent: 0,
    });

    const freshEmpire = await base44.entities.Empire.get(empire.id);
    return Response.json({ record, empire: freshEmpire, charged: updates, research_points_required: effectiveRp });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}