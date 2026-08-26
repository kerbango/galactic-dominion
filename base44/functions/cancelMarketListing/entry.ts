import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Cancels one of the caller's own active listings and returns the unsold
// (escrowed) amount of the resource back to the seller's treasury. Only the
// listing owner may cancel. Runs as the service role for atomicity.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const listingId = body.listingId;
    if (!listingId) return Response.json({ error: 'Missing listing id.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const listing = await svc.entities.MarketListing.get(listingId);
    if (!listing) return Response.json({ error: 'Listing not found.' }, { status: 404 });
    if (listing.created_by_id !== user.id) {
      return Response.json({ error: 'You can only cancel your own listings.' }, { status: 403 });
    }
    if (listing.status !== 'listed' || listing.amount <= 0) {
      return Response.json({ error: 'Listing is no longer active.' }, { status: 400 });
    }

    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'Empire not found.' }, { status: 404 });

    // Return the escrowed (remaining) stock to the seller's treasury.
    await svc.entities.Empire.update(empire.id, {
      [listing.resource_key]: (empire[listing.resource_key] || 0) + listing.amount,
    });

    await svc.entities.MarketListing.delete(listing.id);

    return Response.json({ ok: true, returned: listing.amount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}