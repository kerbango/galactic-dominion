import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getUnit, isUnitUnlocked } from '../../shared/unitsRuntime.ts';

const COST_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

// Starts or queues one or more timed constructions of the given unit type.
// Resources for the full batch are deducted immediately, while ships are
// constructed sequentially through the existing timed completion system.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const unitId = body?.unit_type;
    const requestedQuantity = Number(body?.quantity ?? 1);
    if (!unitId) return Response.json({ error: 'unit_type is required' }, { status: 400 });
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 100000) {
      return Response.json({ error: 'quantity must be a whole number between 1 and 100,000.' }, { status: 400 });
    }

    const unit = getUnit(unitId);
    if (!unit) return Response.json({ error: 'Unknown unit type.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    const completed = await svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'completed' });
    const doneIds = new Set(completed.map((r) => r.tech_id));
    if (!isUnitUnlocked(unit, doneIds)) {
      return Response.json({ error: 'Required research not completed.' }, { status: 400 });
    }

    const existing = await svc.entities.Unit.filter({ created_by_id: user.id, unit_type: unitId });
    const mine = existing.find((u) => u.unit_type === unitId);
    const alreadyBuilding = !!mine?.construction_start_date;
    const queued = Math.max(0, Number(mine?.construction_queue || 0));
    const totalRequested = requestedQuantity;

    // Validate the complete batch before changing any resources.
    const updates = {};
    for (const res of COST_RESOURCES) {
      const perShip = unit.buildCost[res] || 0;
      const totalCost = perShip * totalRequested;
      if (totalCost > 0 && (empire[res] || 0) < totalCost) {
        return Response.json({ error: `Not enough ${res.replace('_', ' ')} to construct ${totalRequested} ship${totalRequested === 1 ? '' : 's'}.` }, { status: 400 });
      }
      if (totalCost > 0) updates[res] = (empire[res] || 0) - totalCost;
    }

    if (Object.keys(updates).length) {
      await svc.entities.Empire.update(empire.id, updates);
    }

    const now = new Date().toISOString();
    if (mine) {
      if (alreadyBuilding) {
        await svc.entities.Unit.update(mine.id, {
          construction_queue: queued + totalRequested,
        });
      } else {
        await svc.entities.Unit.update(mine.id, {
          construction_start_date: now,
          construction_turns: unit.buildTurns,
          construction_queue: Math.max(0, totalRequested - 1),
        });
      }
    } else {
      await svc.entities.Unit.create({
        unit_type: unitId,
        owned_count: 0,
        construction_start_date: now,
        construction_turns: unit.buildTurns,
        construction_queue: Math.max(0, totalRequested - 1),
        upgrade_levels: {},
      });
    }

    return Response.json({
      ok: true,
      unit_type: unitId,
      queued: totalRequested,
      construction_queue: (alreadyBuilding ? queued + totalRequested : Math.max(0, totalRequested - 1)),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}