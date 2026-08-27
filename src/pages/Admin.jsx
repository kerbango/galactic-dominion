import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Loader2, Crown, Gem, Layers, Zap, Coins, Pickaxe, Users, Rocket, Ticket, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import AdminBackground from "@/components/AdminBackground";
import AdminTickets from "@/components/admin/AdminTickets";
import SiteFooter from "@/components/SiteFooter";

const RESOURCES = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
  { key: 'ferrite_titanium', label: 'Ferrite', icon: Layers, color: 'text-slate-300' },
  { key: 'aetherium_crystal', label: 'Aetherium', icon: Gem, color: 'text-violet-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
  { key: 'population', label: 'Population', icon: Users, color: 'text-rose-300' },
];

function fmt(n) {
  if (n == null) return '0';
  return Math.floor(n).toLocaleString();
}

// Admin-only command section. Access is gated by role === "admin"; any other
// user (or unauthenticated visitor) is bounced to the admin login.
export default function Admin() {
  const { user, isLoadingAuth } = useAuth();
  const [empires, setEmpires] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promoteId, setPromoteId] = useState('');
  const [demoteId, setDemoteId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [empireId, setEmpireId] = useState('');
  const [tickBusy, setTickBusy] = useState(false);
  const [tickMsg, setTickMsg] = useState('');
  const [fleetBusy, setFleetBusy] = useState(false);
  const [fleetMsg, setFleetMsg] = useState('');
  const [tab, setTab] = useState('command');
  const [ticketAlert, setTicketAlert] = useState(0);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user || user.role !== 'admin') return;
    let active = true;
    const load = async () => {
      try {
        const all = await base44.entities.Empire.list('-created_date', 500);
        const u = await base44.entities.User.list();
        if (active) {
          setEmpires(all);
          setUsers(u);
        }
      } catch (e) {
        if (active) setError(e.message || 'Failed to load admin data.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [isLoadingAuth, user]);

  // Poll for unseen player ticket activity to drive the blinking alert on the
  // Tickets tab badge. Service-role writes don't reach realtime, so we poll.
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let active = true;
    const pollTickets = async () => {
      try {
        const list = await base44.entities.SupportTicket.list('-created_date', 500);
        if (!active) return;
        const unread = list.filter((t) => t.last_player_activity_date && (!t.last_admin_view_date || new Date(t.last_player_activity_date) > new Date(t.last_admin_view_date))).length;
        setTicketAlert(unread);
      } catch { /* ignore */ }
    };
    pollTickets();
    const poll = setInterval(pollTickets, 30000);
    return () => { active = false; clearInterval(poll); };
  }, [user, tab]);

  const refreshUsers = async () => {
    const u = await base44.entities.User.list();
    setUsers(u);
  };

  const handlePromote = async () => {
    if (!promoteId) return;
    setBusy(true); setMsg('');
    try {
      await base44.functions.invoke('setUserRole', { userId: promoteId, role: 'admin' });
      setPromoteId('');
      setMsg('Admin access granted.');
      await refreshUsers();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Failed to grant admin.');
    } finally { setBusy(false); }
  };

  const handleDemote = async () => {
    if (!demoteId) return;
    setBusy(true); setMsg('');
    try {
      await base44.functions.invoke('setUserRole', { userId: demoteId, role: 'user' });
      setDemoteId('');
      setMsg('Admin access removed.');
      await refreshUsers();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Failed to remove admin.');
    } finally { setBusy(false); }
  };

  const handleTick = async () => {
    setTickBusy(true); setTickMsg('');
    try {
      const res = await base44.functions.invoke('tickResources', {});
      setTickMsg(`Ticked ${res.ticked} empires · research advanced ${res.advanced}, completed ${res.completed}.`);
    } catch (e) {
      setTickMsg(e.response?.data?.error || e.message || 'Tick failed.');
    } finally { setTickBusy(false); }
  };

  const handleProcessFleets = async () => {
    setFleetBusy(true); setFleetMsg('');
    try {
      const res = await base44.functions.invoke('processFleets', {});
      setFleetMsg(`Resolved ${res.resolved} arrivals · ${res.returned} fleets returned home.`);
    } catch (e) {
      setFleetMsg(e.response?.data?.error || e.message || 'Fleet tick failed.');
    } finally { setFleetBusy(false); }
  };

  // Owner = earliest-created account; can never be demoted.
  const owner = [...users].sort((a, b) => new Date(a.created_date) - new Date(b.created_date))[0];
  const promoteList = users.filter((u) => u.role !== 'admin');
  const demoteList = users.filter((u) => u.role === 'admin' && u.id !== owner?.id && u.id !== user?.id);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }



  return (
    <div className="relative min-h-screen w-full">
      <AdminBackground dim={0.5} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center gap-1 mb-8">
        <Shield className="w-7 h-7 text-rose-400" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Admin Command
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-rose-300/70">
          Signed in as {user.email}
        </p>
      </div>

      {error && (
        <div className="glass-panel rounded-lg p-4 mb-6 border border-rose-400/30 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-8 max-w-md mx-auto">
        <button
          onClick={() => setTab('command')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-heading text-xs tracking-[0.2em] uppercase transition-colors ${tab === 'command' ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-100' : 'glass-panel text-muted-foreground hover:text-foreground'}`}
        >
          <Shield className="w-4 h-4" /> Command
        </button>
        <button
          onClick={() => setTab('tickets')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-heading text-xs tracking-[0.2em] uppercase transition-colors ${tab === 'tickets' ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-100' : 'glass-panel text-muted-foreground hover:text-foreground'}`}
        >
          <Ticket className="w-4 h-4" /> Tickets
          {ticketAlert > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-rose-300 border border-rose-400/40 rounded px-1.5 py-0.5 animate-pulse-glow">
              <AlertCircle className="w-2.5 h-2.5" /> {ticketAlert}
            </span>
          )}
        </button>
      </div>

      {tab === 'tickets' && <AdminTickets />}

      {tab === 'command' && (
      <>
      {/* Overview stats */}
      <div className="max-w-3xl mx-auto grid grid-cols-3 gap-3 mb-10">
        <StatCard icon={Crown} label="Empires" value={(empires || []).length} color="text-cyan-300" />
        <StatCard icon={Users} label="Users" value={users.length} color="text-violet-300" />
        <StatCard icon={Shield} label="Admins" value={users.filter((u) => u.role === 'admin').length} color="text-rose-300" />
      </div>

      {/* Resource engine — manual tick for testing */}
      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-4">Resource Engine</h2>
      <div className="glass-panel rounded-2xl p-5 mb-6 flex items-center gap-4 flex-wrap">
        <Button onClick={handleTick} disabled={tickBusy} className="font-heading tracking-widest uppercase">
          {tickBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Run Resource Tick
        </Button>
        {tickMsg && <p className="text-sm text-cyan-200/80">{tickMsg}</p>}
      </div>

      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-4">Fleet Operations</h2>
      <div className="glass-panel rounded-2xl p-5 mb-10 flex items-center gap-4 flex-wrap">
        <Button onClick={handleProcessFleets} disabled={fleetBusy} className="font-heading tracking-widest uppercase">
          {fleetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Process Fleets
        </Button>
        {fleetMsg && <p className="text-sm text-cyan-200/80">{fleetMsg}</p>}
      </div>

      {/* Admin Access Manager */}
      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-4">Admin Access</h2>
      <div className="glass-panel rounded-2xl p-5 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Grant Admin</p>
            <Select value={promoteId} onValueChange={setPromoteId}>
              <SelectTrigger className="w-full bg-background/40"><SelectValue placeholder="Select a player…" /></SelectTrigger>
              <SelectContent>
                {promoteList.length === 0 && <SelectItem value="__none" disabled>No players available</SelectItem>}
                {promoteList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePromote} disabled={busy || !promoteId} className="w-full mt-3 font-heading tracking-widest uppercase">
              Grant Admin
            </Button>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Remove Admin</p>
            <Select value={demoteId} onValueChange={setDemoteId}>
              <SelectTrigger className="w-full bg-background/40"><SelectValue placeholder="Select an admin…" /></SelectTrigger>
              <SelectContent>
                {demoteList.length === 0 && <SelectItem value="__none" disabled>No admins to remove</SelectItem>}
                {demoteList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDemote} disabled={busy || !demoteId} variant="destructive" className="w-full mt-3 font-heading tracking-widest uppercase">
              Remove Admin
            </Button>
          </div>
        </div>
        {msg && <p className="mt-4 text-sm text-cyan-200/80">{msg}</p>}
      </div>

      {/* Empire registry */}
      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-4">Empire Registry</h2>
      <div className="glass-panel rounded-2xl p-5">
        <Select value={empireId} onValueChange={setEmpireId}>
          <SelectTrigger className="w-full bg-background/40"><SelectValue placeholder="Select an empire…" /></SelectTrigger>
          <SelectContent>
            {(empires || []).length === 0 && <SelectItem value="__none" disabled>No empires founded yet</SelectItem>}
            {(empires || []).map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.empire_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(() => {
          const sel = (empires || []).find((e) => e.id === empireId);
          if (!sel) return null;
          return (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Empire</p>
                  <p className="font-heading uppercase tracking-wide text-cyan-100">{sel.empire_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Ruler</p>
                  <p className="text-foreground">{sel.ruler_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sector</p>
                  <p className="font-mono text-muted-foreground">{Math.round(sel.map_x)}, {Math.round(sel.map_y)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RESOURCES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.key} className="glass-panel rounded-lg p-2 text-center">
                      <Icon className={`w-3 h-3 ${r.color} mx-auto mb-1`} />
                      <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt(sel[r.key])}</p>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{r.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
      </>
      )}
      </div>
      <SiteFooter />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-panel rounded-lg p-2 text-center">
      <Icon className={`w-3 h-3 ${color} mx-auto mb-1`} />
      <p className="font-mono text-sm font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}