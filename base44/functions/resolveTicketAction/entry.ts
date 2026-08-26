import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { ticketId, action } = body || {};
    if (!ticketId || !action) return Response.json({ error: 'ticketId and action are required' }, { status: 400 });

    const ticket = await base44.asServiceRole.entities.SupportTicket.get(ticketId);
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });

    if (action === 'name_change') {
      const newName = (ticket.requested_name || '').trim();
      if (!newName) return Response.json({ error: 'No requested name on this ticket' }, { status: 400 });
      const empires = await base44.asServiceRole.entities.Empire.filter({ created_by_id: ticket.created_by_id });
      if (!empires.length) return Response.json({ error: 'No empire found for this player' }, { status: 404 });
      await base44.asServiceRole.entities.Empire.update(empires[0].id, { empire_name: newName });
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.SupportTicket.update(ticketId, {
        status: 'resolved',
        messages: [
          ...ticket.messages,
          { author_role: 'admin', author_name: 'Admin', body: `Name change approved — your empire is now "${newName}".`, date: now }
        ]
      });
      return Response.json({ ok: true, action: 'name_change', new_name: newName });
    }

    if (action === 'reset_account') {
      const empires = await base44.asServiceRole.entities.Empire.filter({ created_by_id: ticket.created_by_id });
      for (const e of empires) await base44.asServiceRole.entities.Empire.delete(e.id);
      await base44.asServiceRole.entities.Fleet.deleteMany({ created_by_id: ticket.created_by_id });
      await base44.asServiceRole.entities.TechProgress.deleteMany({ created_by_id: ticket.created_by_id });
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.SupportTicket.update(ticketId, {
        status: 'resolved',
        messages: [
          ...ticket.messages,
          { author_role: 'admin', author_name: 'Admin', body: 'Account reset — your empire, fleets, and research have been wiped. You can found a new empire from the setup screen.', date: now }
        ]
      });
      return Response.json({ ok: true, action: 'reset_account' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}