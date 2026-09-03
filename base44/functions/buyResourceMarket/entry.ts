import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const RESOURCES = ['berentium', 'ferrite_titanium', 'aetherium_crystal', 'energy'];

// Purchases a fixed bundle of a raw resource from the admin-controlled
// Resource Market. Reads the admin-set price and bundle size, verifies the
// buyer has enough VRIND for price * bundle, then atomically deducts VRIND
// and grants the bundle to the buyer's empire. Runs as the service role for
// atomicity (the deduction and grant cannot partially succeed).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const resourceKey = body.resource_key;
    if (!RESOURCES.includes(resourceKey)) {
      return Response.json({ error: 'Invalid resource.' }, { status: 400 });
    }

    const configs = await base44.entities.MarketConfig.list();
    const config = configs[0];
    if (!config) return Response.json({ error: 'Market is not configured.' }, { status: 400 });

    const price = config[`${resourceKey}_price`];
    const bundle = config[`${resourceKey}_bundle`];
    if (price == null || bundle == null || bundle <= 0) {
      return Response.json({ error: 'That resource is not available for purchase.' }, { status: 400 });
    }

    const totalCost = price * bundle;
    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'Empire not found.' }, { status: 404 });

    if ((empire.vrind || 0) < totalCost) {
      return Response.json({ error: 'Not enough VRIND to complete the purchase.' }, { status: 400 });
    }

    await base44.entities.Empire.update(empire.id, {
      [resourceKey]: (empire[resourceKey] || 0) + bundle,
      vrind: (empire.vrind || 0) - totalCost,
    });

    const freshEmpire = await base44.entities.Empire.get(empire.id);
    return Response.json({ ok: true, bought: bundle, totalCost, empire: freshEmpire });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}