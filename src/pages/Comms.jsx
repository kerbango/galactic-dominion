import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, Loader2, Send } from 'lucide-react';

// Global comms channel — every authenticated player can read and post.
// Messages are stored in the ChatMessage entity and stream in real time via
// the entity subscription. Players without a founded empire are sent to setup.
export default function Comms() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasEmpire, setHasEmpire] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const empires = await base44.entities.Empire.filter({ created_by_id: me.id });
        if (!empires[0]) {
          if (active) setHasEmpire(false);
          return;
        }
        if (active) setAuthorName(empires[0].empire_name);
        const list = await base44.entities.ChatMessage.list('created_date', 200);
        if (active) setMessages(list);
      } catch (e) {
        // ignore — chat still renders empty
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    // Real-time: append new messages as they are created.
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !authorName) return;
    setSending(true);
    setDraft('');
    try {
      await base44.entities.ChatMessage.create({
        author_name: authorName,
        message: text,
      });
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
          {messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-cyan-400/15">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={280}
            placeholder="Transmit a message to the galaxy..."
            className="flex-1 h-10 rounded-md bg-background/50 border border-cyan-400/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-cyan-300/60"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground font-heading text-xs uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function Message({ m }) {
  const time = new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-xs uppercase tracking-widest text-cyan-200">{m.author_name || 'Unknown'}</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">{time}</span>
      </div>
      <p className="text-sm text-foreground/90 break-words font-body">{m.message}</p>
    </div>
  );
}