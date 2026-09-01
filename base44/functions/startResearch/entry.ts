import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { TECH_TREE, normalizePrereqs, getResearchCost } from '../../shared/techTree.ts';

// Starts researching a technology for the calling player. Validates that the
// player has an empire, that all prerequisite techs are completed (AND/OR),
// that the tech isn't already completed, and that no other tech is already in
// progress (one active research per player). Then validates + deducts the
// tech's resource cost and persists a researching TechProgress record.
const techById = new Map(TECH_TREE.map((t) => [t.id, t]));
const COST_RESOURCES = ['research_points', 'vrind'];

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
    if (tech.isGate) {
      return Response.json({ error: 'This technology is a gate and unlocks automatically when its prerequisites are completed.' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire before researching.' }, { status: 400 });

    // Owner-only RLS scopes these reads to the caller's own records.
    const existing = await base44.entities.TechProgress.filter({ tech_id: techId });
    const mine = existing.find((r) => r.tech_id === techId);
    if (mine && mine.status === 'completed') {
      return Response.json({ error: 'Technology already completed.' }, { status: 400 });
    }
    if (mine && mine.status === 'researching') {
      return Response.json({ error: 'Already researching this technology.' }, { status: 400 });
    }

    const inProgress = await base44.entities.TechProgress.filter({ status: 'researching' });
    if (inProgress.length > 0) {
      return Response.json({ error: 'You are already researching another technology.' }, { status: 400 });
    }

    const { all, any } = normalizePrereqs(tech);
    if (all.length || any.length) {
      const completed = await base44.entities.TechProgress.filter({ status: 'completed' });
      const doneIds = new Set(completed.map((r) => r.tech_id));
      const missingAll = all.filter((p) => !doneIds.has(p));
      const anyMet = any.length === 0 || any.some((p) => doneIds.has(p));
      if (missingAll.length || !anyMet) {
        return Response.json({ error: 'Prerequisites not met.' }, { status: 400 });
      }
    }

    const cost = getResearchCost(tech);
    const updates = {};
    for (const res of COST_RESOURCES) {
      const c = cost[res] || 0;
      if (c > 0) {
        if ((empire[res] || 0) < c) {
          return Response.json({ error: 'Not enough resources to begin this research.' }, { status: 400 });
        }
        updates[res] = (empire[res] || 0) - c;
      }
    }
    if (Object.keys(updates).length) {
      await svc.entities.Empire.update(empire.id, updates);
    }

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