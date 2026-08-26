import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Self-service account deletion. Wipes all of the calling user's game data
// (Empire, Fleet, TechProgress, ChatMessage) and flags their User record for
// admin removal. The platform does not allow end users to delete their own
// User record, so the account itself is flagged (deletion_requested) for an
// admin to finalize from the Admin panel. The client logs out and redirects
// to /login immediately after this returns.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Wipe all owner-scoped game data. RLS permits the caller to delete their
    // own records on every entity below.
    await base44.entities.Empire.deleteMany({ created_by_id: user.id });
    await base44.entities.Fleet.deleteMany({ created_by_id: user.id });
    await base44.entities.TechProgress.deleteMany({ created_by_id: user.id });
    await base44.entities.ChatMessage.deleteMany({ created_by_id: user.id });

    // Flag the account for admin removal. updateMe persists custom data on
    // the current user; built-ins (id, email, role) are not overridden.
    await base44.auth.updateMe({ deletion_requested: true });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}