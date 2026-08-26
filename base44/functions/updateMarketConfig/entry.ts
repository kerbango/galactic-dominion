import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const RESOURCES = ['berentium', 'ferrite_titanium', 'aetherium_crystal', 'energy'];

// Updates the single Resource Market config record (admin-only). Accepts a
// partial map of resource -> { price, bundle } and writes flat price/bundle
// fields. Creates the config record on first use. Runs as the service role
// so the admin caller's RLS is not a factor for the singleton record.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const config = body.config;
    if (!config || typeof config !== 'object') {
      return Response.json({ error: 'Missing config.' }, { status: 400 });
    }

    // Build a flat update object from the nested resource map. A null price
    // or bundle marks that resource as unavailable for purchase.
    const update = {};
    for (const key of RESOURCES) {
      const entry = config[key];
      if (!entry || typeof entry !== 'object') continue;
      const price = entry.price === null || entry.price === '' ? null : Number(entry.price);
      const bundle = entry.bundle === null || entry.bundle === '' ? null : Number(entry.bundle);
      if (price !== null && (!isFinite(price) || price < 0)) {
        return Response.json({ error: `Invalid price for ${key}.` }, { status: 400 });
      }
      if (bundle !== null && (!isFinite(bundle) || bundle < 0)) {
        return Response.json({ error: `Invalid bundle size for ${key}.` }, { status: 400 });
      }
      update[`${key}_price`] = price;
      update[`${key}_bundle`] = bundle;
    }

    const svc = base44.asServiceRole;
    const existing = await svc.entities.MarketConfig.list();
    if (existing.length > 0) {
      await svc.entities.MarketConfig.update(existing[0].id, update);
    } else {
      await svc.entities.MarketConfig.create(update);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}