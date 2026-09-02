import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { Loader2, Factory, Rocket, AlertTriangle, Hammer, Clock, Minus, Plus, Layers } from 'lucide-react';
import { BASE_TURN_SECONDS } from '@/data/techTree';
import { formatDuration } from '@/lib/galaxy';
import ConstructionTimer from './ConstructionTimer';
import UnitUpgradeList from './UnitUpgradeList';
import { toastSuccess } from '@/lib/toasts';

const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium' };

export default function ConstructionBay({ unit, unitRecord, unlocked, deployedCount, onBuilt, className = '' }) {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!unit) return null;

  const owned = unitRecord?.owned_count || 0;
  const building = !!unitRecord?.construction_start_date;
  const queue = Math.max(0, Number(unitRecord?.construction_queue || 0));
  const activeAndQueued = building ? queue + 1 : 0;
  const buildTimeSec = (unit.buildTurns || 1) * BASE_TURN_SECONDS;
  const cost = unit.buildCost || {};

  const maxAffordable = useMemo(() => {
    const positiveCosts = Object.entries(cost).filter(([, v]) => v > 0);
    if (!positiveCosts.length) return 100000;
    return Math.max(0, Math.min(100000, ...positiveCosts.map(([k, v]) => Math.floor((empire?.[k] ?? 0) / v))));
  }, [cost, empire]);

  const selectedCost = useMemo(() => Object.fromEntries(
    Object.entries(cost).map(([k, v]) => [k, v * quantity])
  ), [cost, quantity]);

  const affordable = unlocked && quantity >= 1 && quantity <= maxAffordable;

  const setSafeQuantity = (value) => {
    const next = Math.max(1, Math.min(100000, Math.floor(Number(value) || 1)));
    setQuantity(next);
  };

  const build = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buildUnit', { unit_type: unit.id, quantity });
      if (res?.data?.error) { setError(res.data.error); return; }
      const total = quantity;
      toastSuccess('CONSTRUCTION QUEUED', `${unit.name} ×${total} · first ship ready in ${formatDuration(buildTimeSec)}`);
      setQuantity(1);
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
          <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Construction</p>
          <p className="font-mono text-xl font-bold text-amber-300 tabular-nums">{unlocked ? activeAndQueued : 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Factory className="w-3.5 h-3.5 text-amber-300/70" />
            <span className="command-label">Cost Per Ship</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => {
              const lack = (empire?.[k] ?? 0) < v * quantity;
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
            <span className="text-cyan-200 ml-auto">{formatDuration(buildTimeSec)} / ship</span>
          </div>
          {maxAffordable > 0 && (
            <p className="text-[9px] font-mono text-slate-500 mt-2">MAX AFFORDABLE: <span className="text-amber-300">{maxAffordable.toLocaleString()}</span></p>
          )}
        </div>

        <div className="glass-panel rounded-xl p-3 flex flex-col">
          {unlocked ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="command-label inline-flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-cyan-300" /> Build Quantity</span>
                {maxAffordable > 0 && <button type="button" onClick={() => setSafeQuantity(maxAffordable)} disabled={busy} className="text-[9px] font-mono uppercase tracking-wider text-amber-300 hover:text-amber-200 disabled:opacity-50">BUILD MAX</button>}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <button type="button" aria-label="Decrease build quantity" onClick={() => setSafeQuantity(quantity - 1)} disabled={busy || quantity <= 1} className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-900/70 text-slate-200 inline-flex items-center justify-center disabled:opacity-30"><Minus className="w-4 h-4" /></button>
                <input aria-label="Build quantity" type="number" min="1" max="100000" value={quantity} onChange={(e) => setSafeQuantity(e.target.value)} disabled={busy} className="min-w-0 flex-1 h-10 rounded-lg border border-slate-700 bg-slate-950/70 text-center text-cyan-200 font-mono font-bold" />
                <button type="button" aria-label="Increase build quantity" onClick={() => setSafeQuantity(quantity + 1)} disabled={busy || quantity >= maxAffordable} className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-900/70 text-slate-200 inline-flex items-center justify-center disabled:opacity-30"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(selectedCost).filter(([, v]) => v > 0).map(([k, v]) => (
                  <span key={k} className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700/50 bg-slate-900/60 text-slate-400">
                    {RES_LABELS[k] || k}: <span className={((empire?.[k] ?? 0) < v) ? 'text-rose-300' : 'text-cyan-200'}>{Math.floor(v).toLocaleString()}</span>
                  </span>
                ))}
              </div>
              {building ? (
                <div className="mb-3">
                  <ConstructionTimer record={unitRecord} onComplete={() => onBuilt?.()} />
                  {queue > 0 && <p className="text-[10px] font-mono text-amber-300/80 mt-2 text-center">{queue} additional {unit.name}{queue === 1 ? '' : 's'} queued</p>}
                </div>
              ) : null}
              <button
                type="button"
                onClick={build}
                disabled={busy || !affordable}
                className={`w-full h-12 rounded-lg font-heading text-sm tracking-widest uppercase inline-flex items-center justify-center gap-2 transition-colors ${affordable ? 'bg-cyan-500/90 hover:bg-cyan-400 text-slate-900' : 'bg-rose-500/20 border border-rose-400/50 text-rose-200 cursor-not-allowed'}`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : affordable ? <Rocket className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {busy ? 'Queueing…' : affordable ? `Construct ${unit.name} ×${quantity}` : maxAffordable < 1 ? 'Insufficient Resources' : 'Quantity Unaffordable'}
              </button>
            </>
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