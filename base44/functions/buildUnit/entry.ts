import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getUnit, isUnitUnlocked } from '../../shared/units.ts';

const COST_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

// Starts a timed construction of one ship of the given unit type. Validates
// the calling player's empire, that the unit's gating tech is completed
// (server-side re-check — frontend greying is UX only), that no build is
// already in progress for that type (one active construction per type),
// then validates + atomically deducts the build cost and sets the
// construction fields on the player's Unit record (creating it if this is
// the first of that type). Completion is time-based
// (start_date + buildTurns * BASE_TURN_SECONDS) and finalized by the tick.
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

    // Server-side tech gate: the unit's gating tech must be completed.
    const completed = await base44.entities.TechProgress.filter({ status: 'completed' });
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

    // Validate + deduct build cost atomically (same pattern as startResearch).
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