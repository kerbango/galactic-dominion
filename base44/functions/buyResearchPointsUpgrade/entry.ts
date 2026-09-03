import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { nextResearchPointsTier } from '../../shared/researchPoints.ts';

// Purchases the next tier of the repurposed "Research Point Synthesis" upgrade.
// Each tier now grants a flat population bonus (indirectly raising RP/hr) instead
// of incrementing research_points_production_level. Same resource costs and
// immediate-deduct pattern as before. Martial Law does not affect RP.
const COST_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    const currentLevel = empire.research_points_production_level || 0;
    const tier = nextResearchPointsTier(currentLevel);
    if (!tier) {
      return Response.json({ error: 'Research Point synthesis is already at maximum.' }, { status: 400 });
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
    updates.research_points_production_level = tier.level;
    updates.population = (empire.population || 0) + tier.populationBonus;
    await base44.entities.Empire.update(empire.id, updates);

    const fresh = await base44.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, level: tier.level, populationBonus: tier.populationBonus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}