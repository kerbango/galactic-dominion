import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Ticket, Loader2, Send, CheckCircle2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Trash2 } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'bugs', label: 'Bug Report' },
  { key: 'name_change', label: 'Name Change' },
  { key: 'report_player', label: 'Report a Player' },
  { key: 'reset_account', label: 'Reset My Account' },
  { key: 'other', label: 'Other' },
];

const STATUSES = [
  { key: 'all', label: 'All Statuses' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
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

export default function AdminTickets() {
  const [tickets, setTickets] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [busy, setBusy] = useState({});
  const [actionMsg, setActionMsg] = useState('');

  const load = async () => {
    try {
      const list = await base44.entities.SupportTicket.list('-created_date', 500);
      setTickets(list);
    } catch {
      setTickets([]);
    }
  };

  useEffect(() => {
    let active = true;
    const doLoad = async () => {
      try {
        const list = await base44.entities.SupportTicket.list('-created_date', 500);
        if (active) setTickets(list);
      } catch {
        if (active) setTickets([]);
      }
    };
    doLoad();
    const poll = setInterval(doLoad, 30000);
    return () => { active = false; clearInterval(poll); };
  }, []);

  useEffect(() => {
    if (!tickets) return;
    const now = new Date().toISOString();
    const unseen = tickets.filter((t) => t.last_player_activity_date && (!t.last_admin_view_date || new Date(t.last_player_activity_date) > new Date(t.last_admin_view_date)));
    if (unseen.length === 0) return;
    base44.entities.SupportTicket.bulkUpdate(unseen.map((t) => ({ id: t.id, last_admin_view_date: now }))).then(load).catch(() => {});
  }, [tickets?.length]);

  const unreadCount = (tickets || []).filter((t) => t.last_player_activity_date && (!t.last_admin_view_date || new Date(t.last_player_activity_date) > new Date(t.last_admin_view_date))).length;
  const filtered = (tickets || []).filter((t) => (filterStatus === 'all' || t.status === filterStatus) && (filterCategory === 'all' || t.category === filterCategory));

  const handleReply = async (ticket) => {
    const body = (replyText[ticket.id] || '').trim();
    if (!body) return;
    setBusy((b) => ({ ...b, [ticket.id]: 'reply' }));
    try {
      const now = new Date().toISOString();
      await base44.entities.SupportTicket.update(ticket.id, { messages: [...ticket.messages, { author_role: 'admin', author_name: 'Admin', body, date: now }] });
      setReplyText((r) => ({ ...r, [ticket.id]: '' }));
      await load();
    } catch (e) {
      setActionMsg(e.response?.data?.error || e.message || 'Reply failed.');
    } finally { setBusy((b) => ({ ...b, [ticket.id]: null })); }
  };

  const handleStatus = async (ticket, status) => {
    setBusy((b) => ({ ...b, [ticket.id]: 'status' }));
    try {
      await base44.entities.SupportTicket.update(ticket.id, { status });
      await load();
    } catch (e) {
      setActionMsg(e.response?.data?.error || e.message || 'Status update failed.');
    } finally { setBusy((b) => ({ ...b, [ticket.id]: null })); }
  };

  const handleDelete = async (ticket) => {
    if (!window.confirm(`Delete closed ticket "${ticket.subject}"? This cannot be undone.`)) return;
    setBusy((b) => ({ ...b, [ticket.id]: 'delete' }));
    setActionMsg('');
    try {
      await base44.entities.SupportTicket.delete(ticket.id);
      if (openId === ticket.id) setOpenId(null);
      await load();
    } catch (e) {
      setActionMsg(e.response?.data?.error || e.message || 'Delete failed.');
    } finally { setBusy((b) => ({ ...b, [ticket.id]: null })); }
  };

  const handleAction = async (ticket, action) => {
    setBusy((b) => ({ ...b, [ticket.id]: 'action' }));
    setActionMsg('');
    try {
      const res = await base44.functions.invoke('resolveTicketAction', { ticketId: ticket.id, action });
      setActionMsg(action === 'name_change' ? `Name change applied: "${res.new_name}".` : 'Account reset — empire, fleets, and research wiped.');
      await load();
    } catch (e) {
      setActionMsg(e.response?.data?.error || e.message || 'Action failed.');
    } finally { setBusy((b) => ({ ...b, [ticket.id]: null })); }
  };

  if (tickets === null) return <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-cyan-300 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2"><Ticket className="w-5 h-5 text-cyan-300" /><h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase">Support Tickets</h2>{unreadCount > 0 && <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-rose-300 border border-rose-400/40 rounded px-2 py-0.5 animate-pulse-glow"><AlertCircle className="w-3 h-3" /> {unreadCount} new</span>}</div>
        <div className="flex gap-2 ml-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-36 bg-background/40"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent></Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-40 bg-background/40"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      {actionMsg && <p className="text-sm text-cyan-200/80 mb-3">{actionMsg}</p>}
      {filtered.length === 0 ? <div className="glass-panel rounded-2xl p-6 text-center"><p className="text-sm text-muted-foreground font-body">No tickets match these filters.</p></div> : <div className="space-y-2">{filtered.map((t) => {
        const isOpen = openId === t.id;
        const hasUnread = t.last_player_activity_date && (!t.last_admin_view_date || new Date(t.last_player_activity_date) > new Date(t.last_admin_view_date));
        return <div key={t.id} className="glass-panel rounded-lg overflow-hidden">
          <button onClick={() => setOpenId(isOpen ? null : t.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-cyan-400/5 transition-colors">
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap">{hasUnread && <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse-glow shrink-0" />}<span className="font-heading text-sm text-foreground uppercase tracking-wide truncate">{t.subject}</span><span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${STATUS_COLORS[t.status] || ''}`}>{t.status.replace('_', ' ')}</span><span className="text-[9px] uppercase tracking-widest text-muted-foreground">{CATEGORIES.find((c) => c.key === t.category)?.label || t.category}</span></div><p className="text-xs text-muted-foreground mt-0.5">{fmtDate(t.last_player_activity_date || t.created_date)}</p></div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
          </button>
          {isOpen && <div className="px-3 pb-3 space-y-3">
            {t.category === 'name_change' && t.requested_name && <div className="glass-panel rounded-lg p-2.5 border border-cyan-400/25"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Requested Name</p><p className="font-heading text-cyan-100 uppercase tracking-wide">{t.requested_name}</p></div>}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">{t.messages?.map((m, i) => <div key={i} className={`flex ${m.author_role === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-lg p-2.5 ${m.author_role === 'admin' ? 'bg-rose-400/10 border border-rose-400/20' : 'bg-cyan-400/15 border border-cyan-400/25'}`}><p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.author_name} · {fmtDate(m.date)}</p><p className="text-sm text-foreground font-body whitespace-pre-wrap">{m.body}</p></div></div>)}</div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => handleStatus(t, 'in_progress')} disabled={busy[t.id] === 'status'} className="font-heading tracking-widest uppercase text-xs">In Progress</Button>
              <Button size="sm" variant="outline" onClick={() => handleStatus(t, 'resolved')} disabled={busy[t.id] === 'status'} className="font-heading tracking-widest uppercase text-xs">Resolve</Button>
              <Button size="sm" variant="outline" onClick={() => handleStatus(t, 'closed')} disabled={busy[t.id] === 'status'} className="font-heading tracking-widest uppercase text-xs">Close</Button>
              {t.category === 'name_change' && <Button size="sm" onClick={() => handleAction(t, 'name_change')} disabled={busy[t.id] === 'action' || t.status === 'resolved'} className="font-heading tracking-widest uppercase text-xs">{busy[t.id] === 'action' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve Name</Button>}
              {t.category === 'reset_account' && <Button size="sm" variant="destructive" onClick={() => handleAction(t, 'reset_account')} disabled={busy[t.id] === 'action' || t.status === 'resolved'} className="font-heading tracking-widest uppercase text-xs">{busy[t.id] === 'action' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Reset Account</Button>}
              {t.status === 'closed' && <Button size="sm" variant="ghost" onClick={() => handleDelete(t)} disabled={busy[t.id] === 'delete'} className="font-heading tracking-widest uppercase text-xs text-rose-300 hover:bg-rose-400/10 ml-auto">{busy[t.id] === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete</Button>}
            </div>
            <div className="flex gap-2"><Input value={replyText[t.id] || ''} onChange={(e) => setReplyText((r) => ({ ...r, [t.id]: e.target.value }))} placeholder="Reply to player…" className="font-body" onKeyDown={(e) => { if (e.key === 'Enter') handleReply(t); }} /><Button size="icon" onClick={() => handleReply(t)} disabled={busy[t.id] === 'reply' || !(replyText[t.id] || '').trim()}>{busy[t.id] === 'reply' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button></div>
          </div>}
        </div>;
      })}</div>}
    </div>
  );
}