import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Purchases a player market listing. Atomically transfers the bought
// resource from the seller's empire to the buyer's empire and VRIND currency
// the other way, then decrements the listing. Runs as the service role so it
// can update both empires regardless of RLS ownership.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const listingId = body.listingId;
    const buyAmount = Number(body.buyAmount);
    if (!listingId || !buyAmount || buyAmount <= 0) {
      return Response.json({ error: 'Invalid listing or amount.' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // Load the listing.
    const listing = await svc.entities.MarketListing.get(listingId);
    if (!listing) return Response.json({ error: 'Listing not found.' }, { status: 404 });
    if (listing.status !== 'listed' || listing.amount <= 0) {
      return Response.json({ error: 'Listing is no longer available.' }, { status: 400 });
    }
    if (buyAmount > listing.amount) {
      return Response.json({ error: 'Not enough stock on this listing.' }, { status: 400 });
    }

    // Seller cannot buy their own listing.
    if (listing.created_by_id === user.id) {
      return Response.json({ error: 'You cannot buy your own listing.' }, { status: 400 });
    }

    // Load both empires via service role.
    const sellerEmpires = await svc.entities.Empire.filter({ created_by_id: listing.created_by_id });
    const buyerEmpires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const sellerEmpire = sellerEmpires[0];
    const buyerEmpire = buyerEmpires[0];
    if (!sellerEmpire || !buyerEmpire) {
      return Response.json({ error: 'Empire not found.' }, { status: 404 });
    }

    const totalCost = buyAmount * listing.price_per_unit;
    if ((buyerEmpire.vrind || 0) < totalCost) {
      return Response.json({ error: 'Not enough VRIND to complete the purchase.' }, { status: 400 });
    }
    if ((sellerEmpire[listing.resource_key] || 0) < buyAmount) {
      return Response.json({ error: 'Seller no longer holds enough of this resource.' }, { status: 400 });
    }

    // Galactic Council levies a 7% tax on every sale, deducted from the
    // seller's proceeds (the buyer still pays the full listing price).
    const TAX_RATE = 0.07;
    const tax = totalCost * TAX_RATE;
    const sellerProceeds = totalCost - tax;

    // Transfer resources and currency.
    await svc.entities.Empire.update(sellerEmpire.id, {
      [listing.resource_key]: (sellerEmpire[listing.resource_key] || 0) - buyAmount,
      vrind: (sellerEmpire.vrind || 0) + sellerProceeds,
    });
    await base44.entities.Empire.update(buyerEmpire.id, {
      [listing.resource_key]: (buyerEmpire[listing.resource_key] || 0) + buyAmount,
      vrind: (buyerEmpire.vrind || 0) - totalCost,
    });

    // Decrement / close the listing.
    const remaining = listing.amount - buyAmount;
    await svc.entities.MarketListing.update(listing.id, {
      amount: remaining,
      status: remaining <= 0 ? 'sold' : 'listed',
    });

    return Response.json({
      ok: true,
      bought: buyAmount,
      totalCost,
      tax,
      sellerProceeds,
      remaining,
      empire: await base44.entities.Empire.get(buyerEmpire.id),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}