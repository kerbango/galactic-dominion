import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { nextResearchSpeedTier } from '../../shared/researchSpeed.ts';

// Purchases the next tier of the research-speed upgrade for the calling
// player's empire. Validates the empire exists, determines the next tier
// from the stored research_speed_level, validates + atomically deducts the
// tier's resource cost (same immediate-deduct pattern as startResearch /
// buyResourceMarket — no escrow record), and increments the level. Because
// completion is time-based and the bonus is read live, the in-progress
// research (if any) is accelerated immediately with no extra work here.
const COST_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    const currentLevel = empire.research_speed_level || 0;
    const tier = nextResearchSpeedTier(currentLevel);
    if (!tier) {
      return Response.json({ error: 'Research acceleration is already at maximum.' }, { status: 400 });
    }

    const updates = {};
    for (const res of COST_RESOURCES) {
      const c = tier.cost[res] || 0;
      if (c > 0) {
        if ((empire[res] || 0) < c) {
          return Response.json({ error: 'Not enough resources for this upgrade.' }, { status: 400 });
        }
        updates[res] = (empire[res] || 0) - c;
      }
    }
    updates.research_speed_level = tier.level;
    await base44.entities.Empire.update(empire.id, updates);

    const fresh = await base44.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, level: tier.level, bonus: tier.bonus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}