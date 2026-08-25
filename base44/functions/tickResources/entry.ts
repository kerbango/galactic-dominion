import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Hourly resource tick. Each empire earns 1 of every resource (Aetherium
// Crystal, Ferrite-Titanium, Energy, VRIND) per run — every player controls
// a single planet. Runs on a schedule (see function.jsonc) but is also
// invokable by admins.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Empire RLS is owner-only, so read/update as service role to reach every empire.
    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);

    let ticked = 0;
    for (const empire of empires) {
      await base44.asServiceRole.entities.Empire.updateMany(
        { id: empire.id },
        { $inc: {
          aetherium_crystal: 1,
          ferrite_titanium: 1,
          energy: 1,
          vrind: 1,
        } }
      );
      ticked += 1;
    }

    return Response.json({ ok: true, ticked, at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}