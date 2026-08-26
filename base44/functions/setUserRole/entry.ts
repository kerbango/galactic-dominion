import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Promote or demote a user to/from admin. Only admins may call this, and
// the founding owner (earliest created_date) can never be demoted.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const userId = (body.userId || '').toString().trim();
    const role = (body.role || '').toString().trim();
    if (!userId) return Response.json({ error: 'userId is required.' }, { status: 400 });
    if (role !== 'admin' && role !== 'user') {
      return Response.json({ error: 'role must be "admin" or "user".' }, { status: 400 });
    }

    // The owner is the earliest-created account and can never be demoted.
    const users = await base44.asServiceRole.entities.User.list('created_date', 1000);
    const owner = users[0];
    if (owner && owner.id === userId && role !== 'admin') {
      return Response.json({ error: 'The owner cannot be demoted.' }, { status: 403 });
    }

    await base44.asServiceRole.entities.User.update(userId, { role });
    return Response.json({ ok: true, userId, role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}