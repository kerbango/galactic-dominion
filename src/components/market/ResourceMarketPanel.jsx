import React, { useEffect, useState } from 'react';
import { Gem, Zap, Layers, Pickaxe, Coins, Lock, Loader2, Pencil, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Resource Market — admin-controlled fixed-price raw material shop. Prices
// and bundle sizes are stored in a single MarketConfig record (admin-owned)
// and edited inline here via an admin-only "Edit Prices" toggle. Players buy
// fixed bundles; each purchase deducts VRIND and grants the resource, then
// refreshes the shared empire store so treasury values update instantly.
const SHOP = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
];

function fmt(n) {
  if (n == null) return '—';
  return Math.floor(n).toLocaleString();
}

export default function ResourceMarketPanel() {
  const { user } = useAuth();
  const { refresh } = useEmpire();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadConfig = async () => {
    try {
      const list = await base44.entities.MarketConfig.list();
      setConfig(list[0] || null);
    } catch (e) {
      setMsg(e.message || 'Failed to load market config.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const cfgFor = (key) => {
    if (!config) return { price: null, bundle: null };
    return { price: config[`${key}_price`], bundle: config[`${key}_bundle`] };
  };

  const startEdit = () => {
    const d = {};
    SHOP.forEach((r) => {
      const c = cfgFor(r.key);
      d[r.key] = { price: c.price == null ? '' : String(c.price), bundle: c.bundle == null ? '' : String(c.bundle) };
    });
    setDraft(d);
    setEditing(true);
    setMsg('');
  };

  const handleSave = async () => {
    setBusy(true); setMsg('');
    try {
      const updates = {};
      SHOP.forEach((r) => {
        updates[r.key] = {
          price: draft[r.key].price === '' ? null : Number(draft[r.key].price),
          bundle: draft[r.key].bundle === '' ? null : Number(draft[r.key].bundle),
        };
      });
      await base44.functions.invoke('updateMarketConfig', { config: updates });
      setEditing(false);
      setMsg('Market prices updated.');
      await loadConfig();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Failed to save.');
    } finally { setBusy(false); }
  };

  const handleBuy = async (key) => {
    setBusy(true); setMsg('');
    try {
      const res = await base44.functions.invoke('buyResourceMarket', { resource_key: key });
      const result = res.data;
      if (result?.error) throw new Error(result.error);
      setMsg(`Bought ${fmt(result.bought)} for ${fmt(result.totalCost)} VRIND.`);
      await refresh(result.empire);
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Purchase failed.');
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
      </div>
    );
  }

  const anyConfigured = SHOP.some((r) => {
    const c = cfgFor(r.key);
    return c.price != null && c.bundle != null;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-2 text-xs text-orange-500 font-bold">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <p>
          The Resource Market is OVERLORD CONTROLLED. Raw materials are sold in fixed bundles at fixed prices set by the galactic council.
          {!anyConfigured && ' Prices are pending configuration — check back soon.'}
        </p>
      </div>

      {isAdmin && !editing && (
        <div className="flex justify-end">
          <Button onClick={startEdit} variant="outline" size="sm" className="font-heading tracking-widest uppercase text-xs">
            <Pencil className="w-3.5 h-3.5" /> Edit Prices
          </Button>
        </div>
      )}

      {editing && (
        <div className="flex justify-end gap-2">
          <Button onClick={() => setEditing(false)} variant="ghost" size="sm" disabled={busy}>
            <X className="w-3.5 h-3.5" /> Cancel
          </Button>
          <Button onClick={handleSave} size="sm" disabled={busy} className="font-heading tracking-widest uppercase text-xs">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SHOP.map((r) => {
          const Ic = r.icon;
          const c = cfgFor(r.key);
          const available = c.price != null && c.bundle != null;
          const total = (c.price || 0) * (c.bundle || 0);
          return (
            <div key={r.key} className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ic className={`w-4 h-4 ${r.color}`} />
                  <p className="font-heading text-sm uppercase tracking-wide text-cyan-100">{r.label}</p>
                </div>
                <Coins className="w-3.5 h-3.5 text-cyan-300/60" />
              </div>

              {editing ? (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-orange-500 font-bold mb-1">Price / unit</p>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft[r.key].price}
                      onChange={(e) => setDraft({ ...draft, [r.key]: { ...draft[r.key], price: e.target.value } })}
                      placeholder="null"
                      className="bg-background/40 h-9 text-xs"
                    />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Bundle size</p>
                    <Input
                      type="number"
                      min="1"
                      value={draft[r.key].bundle}
                      onChange={(e) => setDraft({ ...draft, [r.key]: { ...draft[r.key], bundle: e.target.value } })}
                      placeholder="null"
                      className="bg-background/40 h-9 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="glass-panel rounded-lg p-2 text-center">
                    <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt(c.price)}</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">VRIND / unit</p>
                  </div>
                  <div className="glass-panel rounded-lg p-2 text-center">
                    <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt(c.bundle)}</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">units / bundle</p>
                  </div>
                </div>
              )}

              {!editing && (
                <button
                  type="button"
                  onClick={() => handleBuy(r.key)}
                  disabled={!available || busy}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-heading text-xs tracking-[0.2em] uppercase transition-colors ${available && !busy ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : available ? `Buy ${fmt(c.bundle)} · ${fmt(total)} VRIND` : 'Unavailable'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {msg && <p className="text-sm text-cyan-200/80 text-center">{msg}</p>}
    </div>
  );
}