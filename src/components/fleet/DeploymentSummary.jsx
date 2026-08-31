import React, { useState, useEffect } from 'react';
import { Crosshair, Rocket, Navigation } from 'lucide-react';
import { UNITS } from '@/data/units';
import { distance, travelSeconds, formatDuration, lightYears } from '@/lib/galaxy';

// Pre-deployment confirmation preview. Shows the target system/faction, the
// selected warship composition with totals and combat strength, and travel
// information (distance, duration, estimated arrival) — all derived from the
// existing galaxy travel utilities so there is no second travel calc system.
// `now` ticks every second so the estimated arrival time stays live.
export default function DeploymentSummary({ target, myEmpire, manifest, unitRecords }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const d = myEmpire && target ? distance(myEmpire, target) : null;
  const secs = d != null ? travelSeconds(d, 'attack') : null;
  const arrival = secs != null ? new Date(now + secs * 1000) : null;

  const entries = Object.entries(manifest).filter(([, n]) => n > 0);
  const totalShips = entries.reduce((s, [, n]) => s + n, 0);
  const totalAttack = entries.reduce((s, [type, n]) => {
    const u = UNITS.find((x) => x.id === type);
    return s + (n || 0) * (u?.baseStats?.attack || 0);
  }, 0);

  return (
    <div className="rounded-lg border border-cyan-400/20 bg-slate-950/40 p-3 space-y-3 relative overflow-hidden">
      <div className="scanline-overlay" />

      {/* TARGET */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-300" />
          <p className="command-label">Target</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">System</p>
            <p className="font-heading text-white truncate">{target?.empire_name || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Faction</p>
            <p className="font-heading text-white truncate">{target?.ruler_name || target?.empire_name || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* SELECTED FORCE */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-3.5 h-3.5 text-cyan-300" />
          <p className="command-label">Selected Force</p>
        </div>
        {entries.length === 0 ? (
          <p className="text-[10px] text-slate-500 italic">No ships selected.</p>
        ) : (
          <div className="space-y-1">
            {entries.map(([type, n]) => {
              const u = UNITS.find((x) => x.id === type);
              return (
                <div key={type} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-200 truncate">{u?.name || type}</span>
                  <span className="font-mono text-cyan-200">×{n}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-1 border-t border-cyan-400/10 text-[10px] font-mono uppercase tracking-widest">
              <span className="text-slate-400">Total: <span className="text-cyan-200">{totalShips}</span></span>
              <span className="text-slate-400">Strength: <span className="text-cyan-200">{totalAttack}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* TRAVEL INFORMATION */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Navigation className="w-3.5 h-3.5 text-cyan-300" />
          <p className="command-label">Travel Information</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Distance</p>
            <p className="font-mono text-cyan-100">{d != null ? `${lightYears(d).toFixed(1)} LY` : '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Duration</p>
            <p className="font-mono text-cyan-100">{secs != null ? formatDuration(secs) : '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Est. Arrival</p>
            <p className="font-mono text-cyan-100">{arrival ? arrival.toLocaleTimeString() : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}