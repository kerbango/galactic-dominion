import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Handshake, Plus, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useEmpire } from '@/lib/EmpireContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Alliance creation page. Currently admin-only — the nav link and route are
// hidden from regular players. Admins can found alliances (name + charter)
// and disband them. The Alliance entity itself is open for future player use.
export default function Alliance() {
  const { user } = useAuth();
  const { empire } = useEmpire();
  const [alliances, setAlliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    try {
      const list = await base44.entities.Alliance.list('-created_date', 100);
      setAlliances(list);
    } catch (e) {
      setMsg(e.message || 'Failed to load alliances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  // Hidden from non-admins for now.
  if (!isAdmin) return <Navigate to="/console" replace />;

  const handleCreate = async () => {
    if (!name.trim()) return setMsg('Enter an alliance name.');
    setBusy(true); setMsg('');
    try {
      await base44.entities.Alliance.create({
        alliance_name: name.trim(),
        description: desc.trim(),
        founder_name: empire?.empire_name || user?.full_name || 'Overlord',
      });
      setName(''); setDesc('');
      setMsg('Alliance founded.');
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Failed to found alliance.');
    } finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Disband this alliance?')) return;
    setBusy(true); setMsg('');
    try {
      await base44.entities.Alliance.delete(id);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Failed to disband.');
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center gap-1 mb-8">
        <Handshake className="w-7 h-7 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Alliances
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
          Forge coalitions across the galaxy
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex items-center gap-2 mb-6 text-xs text-orange-500 font-bold">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <p>RESTRICTED — Alliance founding is currently limited to the Overlord. Player access coming soon.</p>
      </div>

      {/* Creation form */}
      <div className="glass-panel rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-cyan-300" />
          <h2 className="font-heading text-sm tracking-[0.2em] uppercase text-cyan-100">Found an Alliance</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Alliance Name</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Crimson Pact" className="bg-background/40" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Charter / Description</p>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="A short motto or charter..." className="bg-background/40 min-h-[80px]" />
          </div>
          <Button onClick={handleCreate} disabled={busy} className="font-heading tracking-widest uppercase self-start">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Found Alliance
          </Button>
        </div>
      </div>

      {/* Existing alliances */}
      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-4">Active Alliances</h2>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
        </div>
      ) : alliances.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No alliances have been founded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alliances.map((a) => (
            <div key={a.id} className="glass-panel rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading text-sm uppercase tracking-wide text-cyan-100 truncate">{a.alliance_name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    Founded by {a.founder_name || 'Unknown'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  disabled={busy}
                  className="text-muted-foreground hover:text-rose-300 transition-colors shrink-0"
                  title="Disband"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {a.description && (
                <p className="text-sm text-foreground/80 mt-3 font-body">{a.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {msg && <p className="text-sm text-cyan-200/80 text-center mt-4">{msg}</p>}
    </div>
  );
}