import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { getTech } from '@/lib/techLayout';
import { Ship, Lock, Loader2, Sword, Shield, Gauge, Eye, Compass, ShieldHalf, Layers, Ruler, Zap } from 'lucide-react';
import ConstructionTimer from './ConstructionTimer';
import UnitUpgradeList from './UnitUpgradeList';

const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium' };

const STAT_DISPLAY = [
  { key: 'attack', icon: Sword, color: 'text-rose-300', label: 'ATK' },
  { key: 'defense', icon: Shield, color: 'text-sky-300', label: 'DEF' },
  { key: 'stealth', icon: Eye, color: 'text-violet-300', label: 'STH' },
  { key: 'exploration', icon: Compass, color: 'text-emerald-300', label: 'EXP' },
  { key: 'shielding', icon: ShieldHalf, color: 'text-cyan-300', label: 'SHD' },
  { key: 'hull_armor', icon: Layers, color: 'text-stone-300', label: 'HUL' },
  { key: 'speed', icon: Gauge, color: 'text-amber-300', label: 'SPD' },
  { key: 'range', icon: Ruler, color: 'text-orange-300', label: 'RNG' },
  { key: 'efficiency', icon: Zap, color: 'text-yellow-300', label: 'EFF' },
];

// A single ship-type card on the Military roster. Locked cards are greyed
// and show the gating tech name; unlocked cards show owned count, base
// stats, build cost, a build button (or live construction timer when a build
// is in progress), and an expandable per-type upgrade list.
export default function UnitCard({ unit, unitRecord, unlocked, onBuilt }) {
  const { refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const owned = unitRecord?.owned_count || 0;
  const building = !!unitRecord?.construction_start_date;
  const gatingTech = getTech(unit.gatingTechId);

  const build = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buildUnit', { unit_type: unit.id });
      if (res?.data?.error) { setError(res.data.error); return; }
      await refresh();
      onBuilt?.();
    } catch (e) {
      setError(e?.message || 'Build failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-4 flex flex-col ${unlocked ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border ${unlocked ? 'border-cyan-400/25 bg-cyan-400/10' : 'border-slate-600/30 bg-slate-700/20'}`}>
          {unlocked ? <Ship className="w-5 h-5 text-cyan-300" /> : <Lock className="w-5 h-5 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-sm tracking-wide text-white uppercase truncate">{unit.name}</h3>
          <p className="text-[11px] text-orange-400 leading-snug">{unit.description}</p>
        </div>
        {unlocked && (
          <div className="text-right shrink-0">
            <p className="font-mono text-lg font-bold text-cyan-200 tabular-nums">{owned}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Owned</p>
          </div>
        )}
      </div>

      {unlocked ? (
        <>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mt-3 text-[11px] font-mono">
            {STAT_DISPLAY.map(({ key, icon: Icon, color, label }) => (
              <span key={key} className="inline-flex items-center gap-1 whitespace-nowrap" title={label}>
                <Icon className={`w-3 h-3 shrink-0 ${color}`} />
                <span className={color}>{unit.baseStats[key] ?? 0}</span>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(unit.buildCost).filter(([, v]) => v > 0).map(([k, v]) => (
              <span key={k} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/50 text-slate-200">
                {RES_LABELS[k] || k}: <span className="text-cyan-200">{Math.floor(v).toLocaleString()}</span>
              </span>
            ))}
          </div>

          {building ? (
            <ConstructionTimer record={unitRecord} onComplete={() => onBuilt?.()} />
          ) : (
            <button
              onClick={build}
              disabled={busy}
              className="mt-3 w-full rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-slate-900 font-heading text-xs tracking-wide uppercase py-2 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {busy ? 'Deploying…' : `Build ${unit.name}`}
            </button>
          )}
          {error && <p className="text-[10px] text-rose-300 mt-1.5 text-center">{error}</p>}

          <UnitUpgradeList unit={unit} unitRecord={unitRecord} unlocked={unlocked} onDone={onBuilt} />
        </>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Requires {gatingTech?.name || unit.gatingTechId}
          </p>
        </div>
      )}
    </div>
  );
}