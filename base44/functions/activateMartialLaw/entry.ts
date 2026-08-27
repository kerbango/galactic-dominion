import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Activates martial law for the calling player's empire: grants the 5x
// production boost immediately (one cycle's worth at 5x) and resets the
// production clock to now, so the next regular tick comes 60s later. The
// active window (60s) and cooldown (60s) timers are set on the empire so the
// button can count them down and block re-use. Granting upfront avoids the
// race where the single 60s production tick lands just as the boost expires.
const ACTIVE_MS = 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const BOOST_GRANT = 5; // 5x one cycle's production, granted immediately.

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
    const tickedAt = new Date(now).toISOString();

    await base44.entities.Empire.update(empire.id, {
      martial_law_active_until: activeUntil,
      martial_law_cooldown_until: newCooldownUntil,
      aetherium_crystal: (empire.aetherium_crystal || 0) + BOOST_GRANT,
      ferrite_titanium: (empire.ferrite_titanium || 0) + BOOST_GRANT,
      energy: (empire.energy || 0) + BOOST_GRANT,
      vrind: (empire.vrind || 0) + BOOST_GRANT,
      berentium: (empire.berentium || 0) + BOOST_GRANT,
      last_tick_date: tickedAt,
    });

    const fresh = await base44.entities.Empire.get(empire.id);
    return Response.json({ empire: fresh, activeUntil, cooldownUntil: newCooldownUntil });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}