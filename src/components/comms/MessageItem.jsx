import React, { useState } from 'react';
import { Pin, PinOff, Trash2, Ban, VolumeX, Volume2, Megaphone } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// A single chat message. Admins see moderator controls (pin, delete, ban,
// mute). Announcements render with amber emphasis; pinned messages are
// surfaced in a separate section by the parent.
const MUTE_MS = 60 * 60 * 1000; // 1 hour

export default function MessageItem({ m, isAdmin, myUserId, authorUser }) {
  const [busy, setBusy] = useState(false);
  const time = new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isAnnounce = !!m.is_announcement;

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch (e) { /* ignore — subscription reconciles */ } finally { setBusy(false); }
  };

  const togglePin = () => run(() => base44.entities.ChatMessage.update(m.id, { pinned: !m.pinned }));
  const del = () => run(() => base44.entities.ChatMessage.delete(m.id));
  const toggleBan = () => run(() => base44.entities.User.update(m.created_by_id, { chat_banned: !authorUser?.chat_banned }));
  const mute = () => run(() => base44.entities.User.update(m.created_by_id, { chat_muted_until: new Date(Date.now() + MUTE_MS).toISOString() }));
  const unmute = () => run(() => base44.entities.User.update(m.created_by_id, { chat_muted_until: null }));

  const authorBanned = !!authorUser?.chat_banned;
  const authorMuted = authorUser?.chat_muted_until ? new Date(authorUser.chat_muted_until).getTime() > Date.now() : false;

  return (
    <div className={`flex flex-col gap-0.5 ${isAnnounce ? 'border border-amber-300/40 rounded-lg p-2 bg-amber-400/5' : ''}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        {isAnnounce && <Megaphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
        <span className={`font-heading text-xs uppercase tracking-widest ${isAnnounce ? 'text-amber-200' : 'text-cyan-200'}`}>{m.author_name || 'Unknown'}</span>
        {isAnnounce && <span className="text-[9px] font-mono uppercase tracking-widest text-amber-300/80">Announcement</span>}
        <span className="font-mono text-[10px] text-muted-foreground/70">{time}</span>
      </div>
      <p className="text-sm text-foreground/90 break-words font-body">{m.message}</p>
      {isAdmin && (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <Ctrl icon={m.pinned ? PinOff : Pin} label={m.pinned ? 'Unpin' : 'Pin'} onClick={togglePin} active={m.pinned} />
          <Ctrl icon={Trash2} label="Delete" onClick={del} danger />
          <Ctrl icon={Ban} label={authorBanned ? 'Unban' : 'Ban'} onClick={toggleBan} active={authorBanned} />
          {authorMuted
            ? <Ctrl icon={Volume2} label="Unmute" onClick={unmute} />
            : <Ctrl icon={VolumeX} label="Mute 1h" onClick={mute} />}
        </div>
      )}
    </div>
  );
}

function Ctrl({ icon: Icon, label, onClick, danger, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border transition ${
        danger
          ? 'border-rose-400/20 text-rose-300/70 hover:text-rose-200 hover:border-rose-300/50'
          : active
            ? 'border-amber-300/40 text-amber-200 bg-amber-400/10'
            : 'border-cyan-400/15 text-muted-foreground hover:text-cyan-200 hover:border-cyan-300/40'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}