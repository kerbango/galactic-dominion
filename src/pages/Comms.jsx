import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, Loader2, Send, Megaphone, VolumeX, Ban as BanIcon, LockKeyhole } from 'lucide-react';
import MessageItem from '@/components/comms/MessageItem';

const REQUIRED_TECH = 'sub_space_relays';
const FREE_TECH = 'quantum_entanglement_command_matrix';
const MESSAGE_FEE = 50;

// Global comms channel. Access requires Sub-space Relays.
// Before Quantum Entanglement Command Matrix, each transmission costs 50 VRIND.
export default function Comms() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasEmpire, setHasEmpire] = useState(true);
  const [hasRelayTech, setHasRelayTech] = useState(false);
  const [hasQuantumTech, setHasQuantumTech] = useState(false);
  const [researchLoading, setResearchLoading] = useState(true);
  const [announce, setAnnounce] = useState(false);
  const [msg, setMsg] = useState('');
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

        const techRecords = await base44.entities.TechProgress.list('-updated_date', 500);
        const completed = new Set(
          techRecords.filter((r) => r.status === 'completed').map((r) => r.tech_id)
        );
        if (active) {
          setHasRelayTech(completed.has(REQUIRED_TECH));
          setHasQuantumTech(completed.has(FREE_TECH));
        }

        if (!completed.has(REQUIRED_TECH)) return;

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
        if (active) setMsg(e.message || 'Failed to load comms.');
      } finally {
        if (active) {
          setResearchLoading(false);
          setLoading(false);
        }
      }
    };
    load();

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
    setMsg('');
    try {
      const result = await base44.functions.invoke('sendCommsMessage', {
        message: text,
        is_announcement: announce && isAdmin,
      });
      if (result?.vrind_charged > 0) {
        setMsg(`${result.vrind_charged.toLocaleString()} VRIND charged for transmission.`);
      }
      await base44.functions.invoke('pruneChat', {}).catch(() => {});
    } catch (err) {
      setDraft(text);
      setMsg(err.response?.data?.error || err.message || 'Transmission failed.');
    } finally {
      setSending(false);
    }
  };

  if (loading || researchLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!hasEmpire) {
    return <Navigate to="/setup" replace />;
  }

  if (!hasRelayTech) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16">
        <div className="glass-panel-strong rounded-2xl p-10 text-center border border-orange-400/20">
          <LockKeyhole className="w-10 h-10 mx-auto text-orange-300 mb-4" />
          <h1 className="font-heading text-2xl tracking-wide text-white neon-text uppercase">Comms Offline</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-orange-200/70 mt-2">Sub-space communications unavailable</p>
          <p className="text-sm text-foreground/80 mt-5 leading-relaxed">
            Research <span className="font-bold text-orange-300">Sub-space Relays</span> in the Research Nexus to establish the communication backbone for your empire.
          </p>
        </div>
      </div>
    );
  }

  const userMap = new Map(users.map((u) => [u.id, u]));
  const pinned = messages.filter((m) => m.pinned);
  const regular = messages.filter((m) => !m.pinned);
  const fee = hasQuantumTech ? 0 : MESSAGE_FEE;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 flex flex-col h-[calc(100vh-160px)]">
      <div className="flex flex-col items-center text-center gap-1 mb-4">
        <Radio className="w-7 h-7 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">Comms</h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">Galactic Hailing Channel</p>
      </div>

      <div className="glass-panel-strong rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">The channel is silent. Send the first transmission.</p>
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
          <form onSubmit={handleSend} className="p-3 border-t border-cyan-400/15 space-y-2">
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setAnnounce((a) => !a)}
                  title="Announcement mode"
                  className={`flex items-center justify-center h-10 w-10 rounded-md border transition shrink-0 ${announce ? 'bg-amber-400/20 border-amber-300/60 text-amber-200' : 'bg-background/50 border-cyan-400/20 text-muted-foreground hover:text-amber-200'}`}
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
                className={`flex-1 h-10 rounded-md bg-background/50 border px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none ${announce && isAdmin ? 'border-amber-300/50 focus:border-amber-300/70' : 'border-cyan-400/20 focus:border-cyan-300/60'}`}
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground font-heading text-xs uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest px-1">
              <span className={fee > 0 ? 'text-orange-300/80' : 'text-emerald-300/80'}>
                {fee > 0 ? `${MESSAGE_FEE} VRIND per transmission` : 'Transmission fees waived — Quantum Entanglement Command Matrix active'}
              </span>
              {msg && <span className="text-cyan-200/80 normal-case tracking-normal">{msg}</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
