import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { collectSystemIntel, INTEL_RANK } from '../../shared/planetaryIntel.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { target_empire_id: targetId } = await req.json().catch(() => ({}));
    if (!targetId) return Response.json({ error: 'target_empire_id is required' }, { status: 400 });
    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.list('-created_date', 1000);
    const target = empires.find((e) => e.id === targetId);
    if (!target) return Response.json({ error: 'System not found' }, { status: 404 });
    const mine = target.created_by_id === user.id;
    if (mine) {
      const report = await collectSystemIntel(svc, target, 'heavy');
      return Response.json({ system_name: target.empire_name, owner_name: target.empire_name, intelligence_level: 'heavy', confirmed: true, mine: true, ...report });
    }
    const records = await svc.entities.PlanetaryIntelligence.filter({ owner_id: user.id, target_empire_id: targetId });
    const intel = records[0];
    if (!intel) return Response.json({ system_name: target.empire_name, owner_name: target.empire_name, intelligence_level: 'none', confirmed: false, mine: false });
    const result = { system_name: target.empire_name, owner_name: target.empire_name, intelligence_level: intel.intelligence_level, confirmed: true, mine: false, last_scouted_date: intel.last_scouted_date };
    if (INTEL_RANK[intel.intelligence_level] >= 1) result.resources = intel.resources;
    if (INTEL_RANK[intel.intelligence_level] >= 2) { result.population = intel.population; result.defense_strength = intel.defense_strength; }
    if (INTEL_RANK[intel.intelligence_level] >= 3) { result.stationed_fleets = intel.stationed_fleets || []; result.orbital_defenses = intel.orbital_defenses || []; result.active_operations = intel.active_operations || []; }
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}