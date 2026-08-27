import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Activates martial law for the calling player's empire: 60s of 5x production,
// followed by a 60s cooldown before it can be used again. Rejects if the
// empire is still on cooldown. Runs as the calling user (owner RLS already
// permits the update on their own empire).
const ACTIVE_MS = 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'No empire found' }, { status: 404 });

    const now = Date.now();
    const cooldownUntil = empire.martial_law_cooldown_until
      ? new Date(empire.martial_law_cooldown_until).getTime()
      : 0;
    if (now < cooldownUntil) {
      return Response.json({ error: 'Martial law is still on cooldown.' }, { status: 400 });
    }

    const activeUntil = new Date(now + ACTIVE_MS).toISOString();
    const newCooldownUntil = new Date(now + ACTIVE_MS + COOLDOWN_MS).toISOString();

    await base44.entities.Empire.update(empire.id, {
      martial_law_active_until: activeUntil,
      martial_law_cooldown_until: newCooldownUntil,
    });

    const fresh = await base44.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, activeUntil, cooldownUntil: newCooldownUntil });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}