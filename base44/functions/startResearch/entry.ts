import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { TECH_TREE, normalizePrereqs, getResearchCost } from '../../shared/techTreeRuntime.ts';

// Starts researching a technology for the calling player. Validates that the
// player has an empire, that all prerequisite techs are completed (AND/OR),
// that automatic gate prerequisites are satisfied recursively, that the tech
// isn't already completed, and that no other tech is already in progress.
const techById = new Map(TECH_TREE.map((t) => [t.id, t]));
const COST_RESOURCES = ['research_points', 'vrind'];

// Gate technologies are automatic unlock markers and do not receive a
// TechProgress record. Treat a gate as satisfied when its own prerequisites
// are satisfied, recursively, so the first real technology behind a hidden
// gate can actually be researched.
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

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire before researching.' }, { status: 400 });

    // Scope every progress read to the calling player. Do not rely on RLS for
    // gameplay correctness: another player's research must never block yours.
    const existing = await svc.entities.TechProgress.filter({ created_by_id: user.id, tech_id: techId });
    const mine = existing.find((r) => r.tech_id === techId);
    if (mine?.status === 'completed') return Response.json({ error: 'Technology already completed.' }, { status: 400 });
    if (mine?.status === 'researching') return Response.json({ error: 'Already researching this technology.' }, { status: 400 });

    const inProgress = await svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'researching' });
    const researchSlots = (empire.parallel_research_level || 0) >= 1 ? 2 : 1;
    if (inProgress.length >= researchSlots) {
      return Response.json({
        error: researchSlots > 1
          ? `All ${researchSlots} research slots are currently occupied.`
          : 'You are already researching another technology.'
      }, { status: 400 });
    }

    const { all, any } = normalizePrereqs(tech);
    if (all.length || any.length) {
      const completed = await svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'completed' });
      const doneIds = new Set(completed.map((r) => r.tech_id));
      const missingAll = all.filter((p) => !isPrerequisiteSatisfied(p, doneIds));
      const anyMet = any.length === 0 || any.some((p) => isPrerequisiteSatisfied(p, doneIds));
      if (missingAll.length || !anyMet) return Response.json({ error: 'Prerequisites not met.' }, { status: 400 });
    }

    const cost = getResearchCost(tech);
    const updates = {};
    for (const res of COST_RESOURCES) {
      const c = cost[res] || 0;
      if (c > 0) {
        if ((empire[res] || 0) < c) return Response.json({ error: 'Not enough resources to begin this research.' }, { status: 400 });
        updates[res] = (empire[res] || 0) - c;
      }
    }
    if (Object.keys(updates).length) await svc.entities.Empire.update(empire.id, updates);

    const record = await base44.entities.TechProgress.create({
      tech_id: techId,
      status: 'researching',
      progress: 0,
      research_turns: tech.researchTurns,
      start_date: new Date().toISOString(),
    });

    return Response.json({ record, charged: updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
