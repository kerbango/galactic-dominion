import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only global progress reset. Wipes ALL game-state and social data
// across every user (including the admin), returning the entire player base
// to a fresh just-signed-up state. User accounts and MarketConfig (admin
// market settings) are preserved.
//
// Order matters: Fleets and PlanetaryIntelligence are deleted before Empires
// to avoid orphaned references. deleteMany runs with broad queries under the
// service role, bypassing RLS so cross-user records are removed.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Only admins may trigger a global reset.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const counts = {};

    // Wipe in dependency order: fleets/intel first, then the rest.
    const targets = [
      'Fleet',
      'PlanetaryIntelligence',
      'Empire',
      'Unit',
      'TechProgress',
      'MinigameScore',
      'MarketListing',
      'Alliance',
      'ChatMessage',
      'SupportTicket',
    ];

    for (const entity of targets) {
      try {
        const res = await svc.entities[entity].deleteMany({});
        counts[entity] = typeof res?.deletedCount === 'number' ? res.deletedCount : (res?.count ?? 0);
      } catch (e) {
        counts[entity] = `error: ${e.message || e}`;
      }
    }

    // Audit log — who triggered the reset and when.
    try {
      svc.analytics.track({
        eventName: 'admin_global_reset',
        properties: { triggered_by: user.email, triggered_at: new Date().toISOString() },
      });
    } catch { /* best-effort */ }

    return Response.json({ ok: true, counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}