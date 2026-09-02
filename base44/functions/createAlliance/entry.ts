import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const REQUIRED_TECH = 'diplomatic_decree';

// Creates an alliance only after Diplomatic Decree has been completed.
// The server is authoritative so the research gate cannot be bypassed by
// calling the Alliance entity directly from the client.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const allianceName = String(body?.alliance_name || '').trim();
    const description = String(body?.description || '').trim();
    if (!allianceName) return Response.json({ error: 'Enter an alliance name.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    const completed = await svc.entities.TechProgress.filter({
      created_by_id: user.id,
      status: 'completed',
      tech_id: REQUIRED_TECH,
    });
    if (!completed.length) {
      return Response.json({
        error: 'Diplomatic Decree must be researched before founding an alliance.',
        required_technology: REQUIRED_TECH,
      }, { status: 403 });
    }

    const alliance = await base44.entities.Alliance.create({
      alliance_name: allianceName,
      description,
      founder_name: empire.empire_name || user.full_name || 'Overlord',
    });

    return Response.json({ alliance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
