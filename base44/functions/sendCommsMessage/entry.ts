import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const REQUIRED_TECH = 'sub_space_relays';
const TACHYON_TECH = 'tachyon_communications';
const FREE_TECH = 'quantum_entanglement_command_matrix';
const MESSAGE_FEE = 25;
const TACHYON_FEE_MULTIPLIER = 1.5;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || '').trim();
    const isAnnouncement = Boolean(body?.is_announcement);
    if (!message) return Response.json({ error: 'Message cannot be empty.' }, { status: 400 });
    if (message.length > 280) return Response.json({ error: 'Message is limited to 280 characters.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    const completed = await svc.entities.TechProgress.filter({
      created_by_id: user.id,
      status: 'completed',
    });
    const researched = new Set(completed.map((r) => r.tech_id));

    if (!researched.has(REQUIRED_TECH)) {
      return Response.json({
        error: 'Sub-space Relays must be researched before using Comms.',
        required_technology: REQUIRED_TECH,
      }, { status: 403 });
    }

    // Base transmission fee is 25 VRIND. Tachyon Communications adds 50% (37.5 VRIND).
    // Quantum Entanglement Command Matrix overrides all transmission fees to zero.
    const feeWaived = researched.has(FREE_TECH);
    const tachyonActive = researched.has(TACHYON_TECH);
    const fee = feeWaived ? 0 : Math.round(MESSAGE_FEE * (tachyonActive ? TACHYON_FEE_MULTIPLIER : 1));
    const currentVrind = Number(empire.vrind || 0);

    if (currentVrind < fee) {
      return Response.json({
        error: `Insufficient VRIND. Sending a message costs ${fee.toLocaleString()} VRIND.`,
        required_vrind: fee,
        current_vrind: currentVrind,
      }, { status: 400 });
    }

    const updatedEmpire = fee > 0
      ? await svc.entities.Empire.update(empire.id, { vrind: currentVrind - fee })
      : empire;

    const saved = await svc.entities.ChatMessage.create({
      author_name: empire.empire_name || user.full_name || 'Unknown Empire',
      message,
      is_announcement: isAnnouncement && user.role === 'admin',
    });

    return Response.json({
      message: saved,
      vrind_charged: fee,
      vrind_remaining: Number(updatedEmpire?.vrind ?? currentVrind),
      fee_waived: feeWaived,
      tachyon_surcharge_active: tachyonActive && !feeWaived,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to send transmission.' }, { status: 500 });
  }
}
