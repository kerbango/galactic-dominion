import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getEmpireUpgrade, isEmpireUpgradeAvailable } from '../../shared/empireUpgrades.ts';

const COST_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

// Purchases a single tech-gated empire-wide upgrade.
// Roman-numeral upgrades are separate permanent purchases; the server
// re-checks the research gate and prevents duplicate purchases.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const upgradeId = body?.upgrade_id;
    if (!upgradeId) return Response.json({ error: 'upgrade_id is required' }, { status: 400 });

    const upgrade = getEmpireUpgrade(upgradeId);
    if (!upgrade) return Response.json({ error: 'Unknown empire upgrade.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    // Server-side tech gate scoped to the current player.
    const completed = await svc.entities.TechProgress.filter({ created_by_id: user.id, status: 'completed' });
    const doneIds = new Set(completed.map((r) => r.tech_id));
    if (!isEmpireUpgradeAvailable(upgrade, doneIds)) {
      return Response.json({ error: 'Required research not completed.' }, { status: 400 });
    }

    const levels = empire.empire_upgrade_levels || {};
    if ((levels[upgradeId] || 0) >= 1) {
      return Response.json({ error: 'Upgrade has already been purchased.' }, { status: 400 });
    }

    const updates = {};
    for (const res of COST_RESOURCES) {
      const c = upgrade.cost?.[res] || 0;
      if (c > 0) {
        if ((empire[res] || 0) < c) {
          return Response.json({ error: 'Not enough resources for this upgrade.' }, { status: 400 });
        }
        updates[res] = (empire[res] || 0) - c;
      }
    }

    updates.empire_upgrade_levels = { ...levels, [upgradeId]: 1 };
    await svc.entities.Empire.update(empire.id, updates);

    const fresh = await svc.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, level: 1, bonus: upgrade.bonus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
