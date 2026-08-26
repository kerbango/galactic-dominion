import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Keeps the comms channel capped: deletes every message except the newest 50
// and any admin-pinned messages. Invoked from the client right after a send,
// so the cap is enforced as soon as a new transmission lands. Reads/deletes
// run as service role because ChatMessage delete is owner-only for players.
const MAX_MESSAGES = 50;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const all = await base44.asServiceRole.entities.ChatMessage.list('-created_date', 500);
    const deleteIds = [];
    for (let i = 0; i < all.length; i++) {
      // Keep the newest 50, and always keep pinned messages.
      if (i < MAX_MESSAGES || all[i].pinned) continue;
      deleteIds.push(all[i].id);
    }
    for (const id of deleteIds) {
      await base44.asServiceRole.entities.ChatMessage.delete(id);
    }
    return Response.json({ ok: true, pruned: deleteIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}