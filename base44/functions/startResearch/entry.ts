import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { TECH_TREE } from '../../shared/techTree.ts';

// Starts researching a technology for the calling player. Validates that the
// player has an empire, that all prerequisite techs are completed, that the
// tech isn't already completed, and that no other tech is already in progress
// (one active research per player). Persists a TechProgress record; the hourly
// tick advances progress and flips it to completed.
const techById = new Map(TECH_TREE.map((t) => [t.id, t]));

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

    // The player must have founded an empire.
    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);
    const hasEmpire = empires.some((e) => e.created_by_id === user.id);
    if (!hasEmpire) return Response.json({ error: 'You must found an empire before researching.' }, { status: 400 });

    // Owner-only RLS scopes these reads to the caller's own records.
    const existing = await base44.entities.TechProgress.filter({ tech_id: techId });
    const mine = existing.find((r) => r.tech_id === techId);
    if (mine && mine.status === 'completed') {
      return Response.json({ error: 'Technology already completed.' }, { status: 400 });
    }
    if (mine && mine.status === 'researching') {
      return Response.json({ error: 'Already researching this technology.' }, { status: 400 });
    }

    // Only one active research at a time.
    const inProgress = await base44.entities.TechProgress.filter({ status: 'researching' });
    if (inProgress.length > 0) {
      return Response.json({ error: 'You are already researching another technology.' }, { status: 400 });
    }

    // All prerequisites must be completed.
    if (tech.prerequisites && tech.prerequisites.length > 0) {
      const completed = await base44.entities.TechProgress.filter({ status: 'completed' });
      const doneIds = new Set(completed.map((r) => r.tech_id));
      const missing = tech.prerequisites.filter((p) => !doneIds.has(p));
      if (missing.length > 0) {
        return Response.json({ error: 'Prerequisites not met.' }, { status: 400 });
      }
    }

    const record = await base44.entities.TechProgress.create({
      tech_id: techId,
      status: 'researching',
      progress: 0,
      research_turns: tech.researchTurns,
    });

    return Response.json({ record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}