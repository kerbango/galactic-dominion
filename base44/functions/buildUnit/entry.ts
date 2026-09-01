import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getUnit, isUnitUnlocked } from '../../shared/unitsRuntime.ts';

const COST_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

// Starts a timed construction of one ship of the given unit type. Validates
// the calling player's empire and completed research server-side before
// deducting resources and starting construction.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const unitId = body?.unit_type;
    if (!unitId) return Response.json({ error: 'unit_type is required' }, { status: 400 });

    const unit = getUnit(unitId);
    if (!unit) return Response.json({ error: 'Unknown unit type.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    // Explicitly scope research to the calling player. Never rely on RLS or
    // another player's completed research to satisfy a build gate.
    const completed = await svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'completed' });
    const doneIds = new Set(completed.map((r) => r.tech_id));
    if (!isUnitUnlocked(unit, doneIds)) {
      return Response.json({ error: 'Required research not completed.' }, { status: 400 });
    }

    // One active construction per unit type.
    const existing = await base44.entities.Unit.filter({ unit_type: unitId });
    const mine = existing.find((u) => u.unit_type === unitId);
    if (mine && mine.construction_start_date) {
      return Response.json({ error: 'A construction is already in progress for this unit type.' }, { status: 400 });
    }

    // Validate + deduct build cost.
    const updates = {};
    for (const res of COST_RESOURCES) {
      const c = unit.buildCost[res] || 0;
      if (c > 0) {
        if ((empire[res] || 0) < c) {
          return Response.json({ error: 'Not enough resources to build this unit.' }, { status: 400 });
        }
        updates[res] = (empire[res] || 0) - c;
      }
    }
    if (Object.keys(updates).length) {
      await svc.entities.Empire.update(empire.id, updates);
    }

    const now = new Date().toISOString();
    if (mine) {
      await base44.entities.Unit.update(mine.id, {
        construction_start_date: now,
        construction_turns: unit.buildTurns,
      });
    } else {
      await base44.entities.Unit.create({
        unit_type: unitId,
        owned_count: 0,
        construction_start_date: now,
        construction_turns: unit.buildTurns,
        upgrade_levels: {},
      });
    }

    return Response.json({ ok: true, unit_type: unitId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}