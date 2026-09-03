import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getUnit, isUnitUnlocked } from '../../shared/units.ts';
import { getUnitUpgrade, nextUnitUpgradeLevel, unitUpgradeCost } from '../../shared/unitUpgrades.ts';

const COST_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

// Purchases the next level of a per-unit-type upgrade. Validates the unit
// type is unlocked (gating tech completed), the upgrade exists for that
// type, the current level is below max, then validates + atomically deducts
// the scaled cost and bumps the upgrade level stored on the player's Unit
// record. The effect is stored for combat to read later.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const unitId = body?.unit_type;
    const upgradeId = body?.upgrade_id;
    if (!unitId || !upgradeId) {
      return Response.json({ error: 'unit_type and upgrade_id are required' }, { status: 400 });
    }

    const unit = getUnit(unitId);
    if (!unit) return Response.json({ error: 'Unknown unit type.' }, { status: 400 });
    const upgrade = getUnitUpgrade(upgradeId);
    if (!upgrade || upgrade.unitType !== unitId) {
      return Response.json({ error: 'Unknown upgrade for this unit type.' }, { status: 400 });
    }

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    // Server-side tech gate.
    const completed = await base44.entities.TechProgress.filter({ status: 'completed' });
    const doneIds = new Set(completed.map((r) => r.tech_id));
    if (!isUnitUnlocked(unit, doneIds)) {
      return Response.json({ error: 'Required research not completed.' }, { status: 400 });
    }

    // Find or create the Unit record for this type.
    const existing = await base44.entities.Unit.filter({ unit_type: unitId });
    let mine = existing.find((u) => u.unit_type === unitId);
    if (!mine) {
      mine = await base44.entities.Unit.create({ unit_type: unitId, owned_count: 0, upgrade_levels: {} });
    }

    const levels = mine.upgrade_levels || {};
    const currentLevel = levels[upgradeId] || 0;
    const nextLevel = nextUnitUpgradeLevel(upgrade, currentLevel);
    if (!nextLevel) {
      return Response.json({ error: 'Upgrade already at maximum level.' }, { status: 400 });
    }

    const cost = unitUpgradeCost(upgrade, nextLevel);
    const updates = {};
    for (const res of COST_RESOURCES) {
      const c = cost[res] || 0;
      if (c > 0) {
        if ((empire[res] || 0) < c) {
          return Response.json({ error: 'Not enough resources for this upgrade.' }, { status: 400 });
        }
        updates[res] = (empire[res] || 0) - c;
      }
    }
    if (Object.keys(updates).length) {
      await base44.entities.Empire.update(empire.id, updates);
    }

    const newLevels = { ...levels, [upgradeId]: nextLevel };
    await base44.entities.Unit.update(mine.id, { upgrade_levels: newLevels });

    const freshEmpire = await base44.entities.Empire.get(empire.id);
    const freshUnit = await base44.entities.Unit.get(mine.id);
    return Response.json({ ok: true, level: nextLevel, empire: freshEmpire, unit: freshUnit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}