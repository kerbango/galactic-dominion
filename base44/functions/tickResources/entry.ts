import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';

// Hourly resource tick. Each empire earns 1 of every resource (Aetherium
// Crystal, Ferrite-Titanium, Energy, VRIND) per run — every player controls
// a single planet. Runs on a schedule (see function.jsonc) but is also
// invokable by admins.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await authorizeTick(base44);
    if (!guard.ok) return guard.response;

    // Empire RLS is owner-only, so read/update as service role to reach every empire.
    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);

    const tickedAt = new Date().toISOString();
    let ticked = 0;
    for (const empire of empires) {
      await base44.asServiceRole.entities.Empire.updateMany(
        { id: empire.id },
        { $inc: {
          aetherium_crystal: 1,
          ferrite_titanium: 1,
          energy: 1,
          vrind: 1,
        }, $set: {
          last_tick_date: tickedAt,
        } }
      );
      ticked += 1;
    }

    // Advance every player's in-progress research by one turn. TechProgress
    // RLS is owner-only, so read/update as service role to reach all players.
    // research_turns is snapshotted on the record at start, so no dataset
    // lookup is needed here.
    const researching = await base44.asServiceRole.entities.TechProgress.filter(
      { status: 'researching' },
      '-created_date',
      1000
    );
    let advanced = 0;
    let completed = 0;
    for (const tp of researching) {
      const next = (tp.progress || 0) + 1;
      const turns = tp.research_turns || 0;
      if (turns > 0 && next >= turns) {
        await base44.asServiceRole.entities.TechProgress.update(tp.id, {
          status: 'completed',
          progress: turns,
        });
        completed += 1;
      } else {
        await base44.asServiceRole.entities.TechProgress.update(tp.id, { progress: next });
        advanced += 1;
      }
    }

    return Response.json({ ok: true, ticked, advanced, completed, at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}