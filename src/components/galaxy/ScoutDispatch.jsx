import React, { useEffect, useState } from 'react';
import { Loader2, Radar, Navigation } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toastSuccess } from '@/lib/toasts';
import { distance, travelSeconds, formatDuration, lightYears } from '@/lib/galaxy';

const SCOUTS = [
  { id: 'light_scout', label: 'Light Scout', reveals: 'Resources' },
  { id: 'medium_scout', label: 'Medium Scout', reveals: 'Resources, population, defense' },
  { id: 'heavy_scout', label: 'Heavy Scout', reveals: 'Complete available intelligence' },
];

export default function ScoutDispatch({ target, myEmpire, onDispatched }) {
  const [owned, setOwned] = useState({});
  const [selected, setSelected] = useState('light_scout');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    base44.entities.Unit.list('-created_date', 200).then((rows) => setOwned(Object.fromEntries(rows.map((u) => [u.unit_type, u.owned_count || 0]))));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const d = myEmpire && target ? distance(myEmpire, target) : null;
  const secs = d != null ? travelSeconds(d, 'scout', selected) : null;
  const arrival = secs != null ? new Date(now + secs * 1000) : null;
  const scoutMeta = SCOUTS.find((s) => s.id === selected);

  const dispatch = async () => {
    setBusy(true); setError('');
    try {
      const res = await base44.functions.invoke('dispatchFleet', { target_empire_id: target.id, fleet_size: 1, mission_type: 'scout', scout_unit_type: selected });
      setOwned((prev) => ({ ...prev, [selected]: Math.max(0, (prev[selected] || 0) - 1) }));
      const scoutLabel = scoutMeta?.label || 'Scout';
      const fleet = res?.data?.fleet;
      const eta = fleet?.arrival_date ? new Date(fleet.arrival_date).toLocaleTimeString() : null;
      toastSuccess('SCOUT DEPLOYED', `${scoutLabel} → ${target.empire_name}${eta ? ' · ETA ' + eta : ''}`);
      onDispatched?.();
    } catch (e) { setError(e.response?.data?.error || e.message || 'Scout dispatch failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {/* Scout class selection */}
      <div className="space-y-2">
        {SCOUTS.map((s) => (
          <button key={s.id} onClick={() => setSelected(s.id)} disabled={!owned[s.id]} className={`w-full min-h-11 rounded-lg border p-2 text-left transition-colors ${selected === s.id ? 'border-cyan-300/60 bg-cyan-400/10' : 'border-cyan-400/10 bg-slate-950/30'} disabled:opacity-35`}>
            <span className="flex justify-between text-xs font-heading uppercase">
              <span>{s.label}</span>
              <span className="font-mono text-cyan-200">{owned[s.id] || 0} ready</span>
            </span>
            <span className="text-[10px] text-muted-foreground">Reveals: {s.reveals}</span>
          </button>
        ))}
      </div>

      {/* Travel preview — updates when destination or scout class changes */}
      <div className="rounded-lg border border-cyan-400/20 bg-slate-950/40 p-3 space-y-2 relative overflow-hidden">
        <div className="scanline-overlay" />
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-cyan-300" />
          <p className="command-label">Scout Reconnaissance</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Target</p>
            <p className="font-heading text-white truncate">{target?.empire_name || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Scout Class</p>
            <p className="font-heading text-cyan-100 truncate">{scoutMeta?.label || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Distance</p>
            <p className="font-mono text-cyan-100">{d != null ? `${lightYears(d).toFixed(1)} LY` : '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Travel Time</p>
            <p className="font-mono text-cyan-100">{secs != null ? formatDuration(secs) : '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Est. Arrival</p>
            <p className="font-mono text-cyan-100">{arrival ? arrival.toLocaleTimeString() : '—'}</p>
          </div>
        </div>
        <div className="pt-1 border-t border-cyan-400/10">
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Intelligence</p>
          <p className="text-[10px] text-muted-foreground">{scoutMeta?.reveals || '—'}</p>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <button onClick={dispatch} disabled={busy || !owned[selected]} className="command-btn flex h-11 w-full items-center justify-center gap-2 rounded-lg disabled:opacity-40">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
        <span className="font-heading text-xs tracking-widest">LAUNCH SCOUT</span>
      </button>
    </div>
  );
}