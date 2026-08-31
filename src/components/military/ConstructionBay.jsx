import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { Loader2, Factory, Rocket, AlertTriangle, Hammer, Clock } from 'lucide-react';
import { BASE_TURN_SECONDS } from '@/data/techTree';
import { formatDuration } from '@/lib/galaxy';
import ConstructionTimer from './ConstructionTimer';
import UnitUpgradeList from './UnitUpgradeList';
import { toastSuccess } from '@/lib/toasts';

const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium' };

// Bottom construction bay: inventory summary (available / deployed / under
// construction), build cost with affordability highlighting, build time, and
// the primary CONSTRUCT action (or live construction timer). Reuses the
// existing buildUnit backend function — no logic changes. Deployed counts are
// derived from active fleet manifests passed in from the page.
export default function ConstructionBay({ unit, unitRecord, unlocked, deployedCount, onBuilt, className = '' }) {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!unit) return null;

  const owned = unitRecord?.owned_count || 0;
  const building = !!unitRecord?.construction_start_date;
  const buildTimeSec = (unit.buildTurns || 1) * BASE_TURN_SECONDS;
  const cost = unit.buildCost || {};

  // Affordability: compare against the empire treasury for display only.
  // The backend buildUnit function remains the source of truth.
  const missingRes = Object.entries(cost).filter(([k, v]) => v > 0 && (empire?.[k] ?? 0) < v);
  const affordable = unlocked && missingRes.length === 0;

  const build = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buildUnit', { unit_type: unit.id });
      if (res?.data?.error) { setError(res.data.error); return; }
      toastSuccess('CONSTRUCTION STARTED', `${unit.name} · ready in ${formatDuration(buildTimeSec)}`);
      await refresh();
      onBuilt?.();
    } catch (e) {
      setError(e?.message || 'Build failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`glass-panel-strong rounded-2xl p-4 md:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-amber-300" />
          <h2 className="font-heading text-sm md:text-base tracking-[0.15em] text-white uppercase">Construction Bay</h2>
        </div>
        {unlocked && <span className="command-status">{building ? 'Building' : 'Ready'}</span>}
      </div>

      {/* inventory summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="glass-panel rounded-lg p-2.5 text-center">
          <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Available</p>
          <p className="font-mono text-xl font-bold text-cyan-200 tabular-nums">{unlocked ? owned : '—'}</p>
        </div>
        <div className="glass-panel rounded-lg p-2.5 text-center">
          <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Deployed</p>
          <p className="font-mono text-xl font-bold text-violet-200 tabular-nums">{unlocked ? deployedCount : '—'}</p>
        </div>
        <div className="glass-panel rounded-lg p-2.5 text-center">
          <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Under Construction</p>
          <p className="font-mono text-xl font-bold text-amber-300 tabular-nums">{unlocked && building ? 1 : 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* cost + time */}
        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Factory className="w-3.5 h-3.5 text-amber-300/70" />
            <span className="command-label">Build Cost</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => {
              const lack = (empire?.[k] ?? 0) < v;
              return (
                <span key={k} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${lack ? 'border-rose-400/50 bg-rose-500/10 text-rose-200' : 'border-slate-700/50 bg-slate-900/60 text-slate-200'}`}>
                  {RES_LABELS[k] || k}: <span className={lack ? 'text-rose-300' : 'text-cyan-200'}>{Math.floor(v).toLocaleString()}</span>
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] font-mono uppercase tracking-widest text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-300/70" />
            <span>Build Time</span>
            <span className="text-cyan-200 ml-auto">{formatDuration(buildTimeSec)}</span>
          </div>
        </div>

        {/* action */}
        <div className="glass-panel rounded-xl p-3 flex flex-col">
          {unlocked ? (
            building ? (
              <ConstructionTimer record={unitRecord} onComplete={() => onBuilt?.()} />
            ) : (
              <button
                type="button"
                onClick={build}
                disabled={busy || !affordable}
                className={`w-full h-12 rounded-lg font-heading text-sm tracking-widest uppercase inline-flex items-center justify-center gap-2 transition-colors ${affordable ? 'bg-cyan-500/90 hover:bg-cyan-400 text-slate-900' : 'bg-rose-500/20 border border-rose-400/50 text-rose-200 cursor-not-allowed'}`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : affordable ? <Rocket className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {busy ? 'Deploying…' : affordable ? `Construct ${unit.name}` : 'Insufficient Resources'}
              </button>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-4">
              <div>
                <AlertTriangle className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Hull locked</p>
              </div>
            </div>
          )}
          {error && <p className="text-[10px] text-rose-300 mt-2 text-center">{error}</p>}
        </div>
      </div>

      {unlocked && (
        <UnitUpgradeList unit={unit} unitRecord={unitRecord} unlocked={unlocked} onDone={onBuilt} />
      )}
    </div>
  );
}