import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const TRADEABLE = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'berentium'];

// Creates a player market listing and escrows the listed resource: the
// listed amount is deducted from the seller's empire immediately so it
// cannot be spent elsewhere or double-listed. Runs as the service role so
// the deduction and the listing create cannot partially succeed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const resourceKey = body.resource_key;
    const amount = Number(body.amount);
    const pricePerUnit = Number(body.price_per_unit);

    if (!TRADEABLE.includes(resourceKey)) {
      return Response.json({ error: 'That resource cannot be traded.' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return Response.json({ error: 'Enter a valid amount.' }, { status: 400 });
    }
    if (!pricePerUnit || pricePerUnit <= 0) {
      return Response.json({ error: 'Enter a valid price per unit.' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'Empire not found.' }, { status: 404 });

    if ((empire[resourceKey] || 0) < amount) {
      return Response.json({ error: 'You do not have enough of that resource to list.' }, { status: 400 });
    }

    // Escrow: deduct the listed amount from the seller's treasury.
    await svc.entities.Empire.update(empire.id, {
      [resourceKey]: (empire[resourceKey] || 0) - amount,
    });

    const listing = await svc.entities.MarketListing.create({
      seller_name: empire.empire_name,
      resource_key: resourceKey,
      amount,
      price_per_unit: pricePerUnit,
      status: 'listed',
    });

    return Response.json({ ok: true, listing });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}