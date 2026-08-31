import React, { useEffect, useState } from 'react';
import { Loader2, Radar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SCOUTS = [
  { id: 'light_scout', label: 'Light Scout', reveals: 'Resources' },
  { id: 'medium_scout', label: 'Medium Scout', reveals: 'Resources, population, defense' },
  { id: 'heavy_scout', label: 'Heavy Scout', reveals: 'Complete available intelligence' },
];

export default function ScoutDispatch({ target, onDispatched }) {
  const [owned, setOwned] = useState({});
  const [selected, setSelected] = useState('light_scout');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { base44.entities.Unit.list('-created_date', 200).then((rows) => setOwned(Object.fromEntries(rows.map((u) => [u.unit_type, u.owned_count || 0])))); }, []);
  const dispatch = async () => {
    setBusy(true); setError('');
    try {
      await base44.functions.invoke('dispatchFleet', { target_empire_id: target.id, fleet_size: 1, mission_type: 'scout', scout_unit_type: selected });
      setOwned((prev) => ({ ...prev, [selected]: Math.max(0, (prev[selected] || 0) - 1) }));
      onDispatched?.();
    } catch (e) { setError(e.response?.data?.error || e.message || 'Scout dispatch failed.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2">
    {SCOUTS.map((s) => <button key={s.id} onClick={() => setSelected(s.id)} disabled={!owned[s.id]} className={`w-full min-h-11 rounded-lg border p-2 text-left ${selected === s.id ? 'border-cyan-300/60 bg-cyan-400/10' : 'border-cyan-400/10 bg-slate-950/30'} disabled:opacity-35`}><span className="flex justify-between text-xs font-heading uppercase"><span>{s.label}</span><span className="font-mono text-cyan-200">{owned[s.id] || 0} ready</span></span><span className="text-[10px] text-muted-foreground">Reveals: {s.reveals}</span></button>)}
    {error && <p className="text-xs text-destructive">{error}</p>}
    <button onClick={dispatch} disabled={busy || !owned[selected]} className="command-btn flex h-11 w-full items-center justify-center gap-2 rounded-lg disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}<span className="font-heading text-xs tracking-widest">LAUNCH SCOUT</span></button>
  </div>;
}