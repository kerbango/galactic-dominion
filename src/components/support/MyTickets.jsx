import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Ticket, Plus, Loader2, Send, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = [
  { key: 'bugs', label: 'Bug Report' },
  { key: 'name_change', label: 'Name Change' },
  { key: 'report_player', label: 'Report a Player' },
  { key: 'reset_account', label: 'Reset My Account' },
  { key: 'other', label: 'Other' },
];

const STATUS_COLORS = {
  open: 'text-cyan-300 border-cyan-400/40',
  in_progress: 'text-amber-300 border-amber-400/40',
  resolved: 'text-emerald-300 border-emerald-400/40',
  closed: 'text-slate-400 border-slate-500/40',
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MyTickets() {
  const [tickets, setTickets] = useState(null);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('bugs');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requestedName, setRequestedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyBusy, setReplyBusy] = useState({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        if (active) setUser(me);
        const list = await base44.entities.SupportTicket.filter({ created_by_id: me.id }, '-created_date', 200);
        if (active) setTickets(list);
      } catch {
        if (active) setTickets([]);
      }
    };
    load();
    const poll = setInterval(load, 30000);
    return () => { active = false; clearInterval(poll); };
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true); setError('');
    try {
      const now = new Date().toISOString();
      await base44.entities.SupportTicket.create({
        subject: subject.trim(),
        category,
        status: 'open',
        requested_name: category === 'name_change' ? requestedName.trim() : undefined,
        messages: [{ author_role: 'player', author_name: user?.full_name || user?.email || 'You', body: message.trim(), date: now }],
        last_player_activity_date: now,
      });
      setSubject(''); setMessage(''); setRequestedName(''); setCategory('bugs'); setShowForm(false);
      const me = await base44.auth.me();
      const list = await base44.entities.SupportTicket.filter({ created_by_id: me.id }, '-created_date', 200);
      setTickets(list);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to submit ticket.');
    } finally { setSubmitting(false); }
  };

  const handleReply = async (ticket) => {
    const body = (replyText[ticket.id] || '').trim();
    if (!body) return;
    setReplyBusy((b) => ({ ...b, [ticket.id]: true }));
    try {
      const now = new Date().toISOString();
      const newStatus = (ticket.status === 'resolved' || ticket.status === 'closed') ? 'open' : ticket.status;
      await base44.entities.SupportTicket.update(ticket.id, {
        status: newStatus,
        messages: [...ticket.messages, { author_role: 'player', author_name: user?.full_name || user?.email || 'You', body, date: now }],
        last_player_activity_date: now,
      });
      setReplyText((r) => ({ ...r, [ticket.id]: '' }));
      const me = await base44.auth.me();
      const list = await base44.entities.SupportTicket.filter({ created_by_id: me.id }, '-created_date', 200);
      setTickets(list);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to post reply.');
    } finally { setReplyBusy((b) => ({ ...b, [ticket.id]: false })); }
  };

  if (tickets === null) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-cyan-300" />
          <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase">My Tickets</h2>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)} className="font-heading tracking-widest uppercase">
          {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />} New Ticket
        </Button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-xl p-4 mb-4 space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-widest text-cyan-200/70 mb-1.5 block">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full bg-background/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-cyan-200/70 mb-1.5 block">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary…" className="font-body" />
          </div>
          {category === 'name_change' && (
            <div>
              <Label className="text-xs uppercase tracking-widest text-cyan-200/70 mb-1.5 block">Requested Empire Name</Label>
              <Input value={requestedName} onChange={(e) => setRequestedName(e.target.value)} placeholder="New empire name" className="font-body" />
            </div>
          )}
          <div>
            <Label className="text-xs uppercase tracking-widest text-cyan-200/70 mb-1.5 block">Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue…" rows={4} className="font-body resize-none" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} disabled={submitting || !subject.trim() || !message.trim()} className="font-heading tracking-widest uppercase">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Ticket
          </Button>
        </div>
      )}

      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body text-center py-4">No tickets yet. Open one to get help.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const isOpen = openId === t.id;
            const lastMsg = t.messages?.[t.messages.length - 1];
            const adminReplied = lastMsg?.author_role === 'admin';
            return (
              <div key={t.id} className="glass-panel rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : t.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-cyan-400/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading text-sm text-foreground uppercase tracking-wide truncate">{t.subject}</span>
                      <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${STATUS_COLORS[t.status] || ''}`}>{t.status.replace('_', ' ')}</span>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{CATEGORIES.find((c) => c.key === t.category)?.label || t.category}</span>
                      {adminReplied && <span className="text-[9px] uppercase tracking-widest text-emerald-300/80">Admin replied</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg?.body}</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-3">
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {t.messages?.map((m, i) => (
                        <div key={i} className={`flex ${m.author_role === 'player' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg p-2.5 ${m.author_role === 'player' ? 'bg-cyan-400/15 border border-cyan-400/25' : 'bg-rose-400/10 border border-rose-400/20'}`}>
                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">
                              {m.author_role === 'player' ? 'You' : m.author_name} · {fmtDate(m.date)}
                            </p>
                            <p className="text-sm text-foreground font-body whitespace-pre-wrap">{m.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={replyText[t.id] || ''}
                        onChange={(e) => setReplyText((r) => ({ ...r, [t.id]: e.target.value }))}
                        placeholder="Reply…"
                        className="font-body"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleReply(t); }}
                      />
                      <Button size="icon" onClick={() => handleReply(t)} disabled={replyBusy[t.id] || !(replyText[t.id] || '').trim()}>
                        {replyBusy[t.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : (t.status === 'resolved' || t.status === 'closed' ? <RotateCcw className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                      </Button>
                    </div>
                    {(t.status === 'resolved' || t.status === 'closed') && (
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Replying reopens this ticket.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}