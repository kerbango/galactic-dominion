import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, Loader2, Send, Megaphone, VolumeX, Ban as BanIcon } from 'lucide-react';
import MessageItem from '@/components/comms/MessageItem';

// Global comms channel. Every founded player can read and post; admins get
// moderator controls (pin, delete, ban, mute) and can post announcements.
// Storage is capped at the newest 50 messages (plus pinned) by the pruneChat
// backend function, invoked after each send.
export default function Comms() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasEmpire, setHasEmpire] = useState(true);
  const [announce, setAnnounce] = useState(false);
  const listRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        if (active) setUser(me);
        const empires = await base44.entities.Empire.filter({ created_by_id: me.id });
        if (!empires[0]) {
          if (active) setHasEmpire(false);
          return;
        }
        if (active) setAuthorName(empires[0].empire_name);
        const [recent, pinned] = await Promise.all([
          base44.entities.ChatMessage.list('created_date', 50),
          base44.entities.ChatMessage.filter({ pinned: true }),
        ]);
        const merged = [...recent, ...pinned].filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
        merged.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        if (active) setMessages(merged);
        if (me.role === 'admin') {
          const u = await base44.entities.User.list();
          if (active) setUsers(u);
        }
      } catch (e) {
        // ignore — chat still renders empty
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    // Real-time: append, update (pin/ban), and remove (delete) messages.
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      setMessages((prev) => {
        if (event.type === 'create') {
          if (prev.some((m) => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        }
        if (event.type === 'update') {
          return prev.map((m) => (m.id === event.data.id ? { ...m, ...event.data } : m));
        }
        if (event.type === 'delete') {
          return prev.filter((m) => m.id !== event.data.id);
        }
        return prev;
      });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const banned = !!user?.chat_banned;
  const mutedUntil = user?.chat_muted_until ? new Date(user.chat_muted_until).getTime() : 0;
  const muted = mutedUntil > Date.now();
  const lockedOut = banned || muted;

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !authorName || lockedOut) return;
    setSending(true);
    setDraft('');
    try {
      await base44.entities.ChatMessage.create({
        author_name: authorName,
        message: text,
        is_announcement: announce && isAdmin,
      });
      // Enforce the 50-message storage cap right after the new message lands.
      await base44.functions.invoke('pruneChat', {}).catch(() => {});
    } catch (err) {
      setDraft(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!hasEmpire) {
    return <Navigate to="/setup" replace />;
  }

  const userMap = new Map(users.map((u) => [u.id, u]));
  const pinned = messages.filter((m) => m.pinned);
  const regular = messages.filter((m) => !m.pinned);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 flex flex-col h-[calc(100vh-160px)]">
      <div className="flex flex-col items-center text-center gap-1 mb-4">
        <Radio className="w-7 h-7 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Comms
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
          Galactic Hailing Channel
        </p>
      </div>

      <div className="glass-panel-strong rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">
              The channel is silent. Send the first transmission.
            </p>
          )}
          {pinned.length > 0 && (
            <div className="space-y-2 pb-3 mb-3 border-b border-cyan-400/15">
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/70">Pinned</p>
              {pinned.map((m) => (
                <MessageItem key={m.id} m={m} isAdmin={isAdmin} myUserId={user?.id} authorUser={userMap.get(m.created_by_id)} />
              ))}
            </div>
          )}
          {regular.map((m) => (
            <MessageItem key={m.id} m={m} isAdmin={isAdmin} myUserId={user?.id} authorUser={userMap.get(m.created_by_id)} />
          ))}
        </div>

        {lockedOut ? (
          <div className="p-3 border-t border-rose-400/20 flex items-center gap-2 text-sm text-rose-300">
            {banned ? <BanIcon className="w-4 h-4 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0" />}
            <span>{banned ? 'You are banned from this channel.' : `You are muted until ${new Date(mutedUntil).toLocaleString()}.`}</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-cyan-400/15">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAnnounce((a) => !a)}
                title="Announcement mode"
                className={`flex items-center justify-center h-10 w-10 rounded-md border transition shrink-0 ${
                  announce
                    ? 'bg-amber-400/20 border-amber-300/60 text-amber-200'
                    : 'bg-background/50 border-cyan-400/20 text-muted-foreground hover:text-amber-200'
                }`}
              >
                <Megaphone className="w-4 h-4" />
              </button>
            )}
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={280}
              placeholder={announce && isAdmin ? 'Broadcast an announcement…' : 'Transmit a message to the galaxy...'}
              className={`flex-1 h-10 rounded-md bg-background/50 border px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none ${
                announce && isAdmin ? 'border-amber-300/50 focus:border-amber-300/70' : 'border-cyan-400/20 focus:border-cyan-300/60'
              }`}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground font-heading text-xs uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}