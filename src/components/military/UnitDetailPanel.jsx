import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { getTech } from '@/lib/techLayout';
import { unitStatMultipliers, upgradesForUnit } from '@/data/unitUpgrades';
import { Ship, Lock, Loader2, Package, Footprints, Building2, Crosshair, Factory, BarChart3 } from 'lucide-react';
import StatBar from './StatBar';
import ConstructionTimer from './ConstructionTimer';
import UnitUpgradeList from './UnitUpgradeList';
import { getStatDisplay, isTransport } from '@/lib/unitStats';
import { BASE_TURN_SECONDS } from '@/data/techTree';
import { formatDuration } from '@/lib/galaxy';
import { toastSuccess } from '@/lib/toasts';

const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium' };

const CATEGORY_ICON = {
  ship: Ship, transport: Package, ground: Footprints, defense: Building2,
};

// Right-hand detail panel for the selected ship. Shows effective stats
// (base × per-type upgrade multipliers) as diagnostic bars, build cost,
// the build button / live construction timer, and the upgrade list.
export default function UnitDetailPanel({ unit, unitRecord, unlocked, onBuilt }) {
  const { refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const owned = unitRecord?.owned_count || 0;
  const building = !!unitRecord?.construction_start_date;
  const gatingTech = getTech(unit.gatingTechId);
  const multipliers = unitStatMultipliers(unit.id, unitRecord?.upgrade_levels || {});
  const upgrades = upgradesForUnit(unit.id);
  const maxMul = {};
  for (const up of upgrades) maxMul[up.stat] = 1 + up.perLevel * up.maxLevel;
  const statDisplay = getStatDisplay(unit);
  const CatIcon = CATEGORY_ICON[unit.category || 'ship'] || Ship;

  const build = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buildUnit', { unit_type: unit.id });
      if (res?.data?.error) { setError(res.data.error); return; }
      const completionSec = (unit.buildTurns || 1) * BASE_TURN_SECONDS;
      toastSuccess('CONSTRUCTION STARTED', `${unit.name} · ready in ${formatDuration(completionSec)}`);
      await refresh();
      onBuilt?.();
    } catch (e) {
      setError(e?.message || 'Build failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`glass-panel-strong rounded-2xl p-5 flex flex-col ${unlocked ? '' : 'opacity-70'}`}>
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-cyan-400/10">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-300/70" />
          <p className="command-label">Hull Specification</p>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/45">Tactical Data</span>
      </div>
      <div className="flex items-start gap-3 mb-4">
        <div className={`shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl border ${unlocked ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-slate-600/40 bg-slate-700/30'}`}>
          {unlocked ? <CatIcon className="w-6 h-6 text-cyan-300" /> : <Lock className="w-6 h-6 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg tracking-wide text-white uppercase">{unit.name}</h3>
          <p className="text-[11px] text-orange-400 leading-snug">{unit.description}</p>
        </div>
        {unlocked && (
          <div className="text-right shrink-0">
            <p className="font-mono text-2xl font-bold text-cyan-200 tabular-nums leading-none">{owned}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Owned</p>
          </div>
        )}
      </div>

      {unlocked ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-300/60" />
            <p className="command-label">Combat Performance</p>
          </div>
          <div className="space-y-1.5 mb-4">
            {statDisplay.map(({ key, icon, label }) => {
              const base = unit.baseStats[key] ?? 0;
              const mul = multipliers[key] || 1;
              return (
                <StatBar key={key} stat={key} icon={icon} label={label} value={base * mul} base={base} multiplier={mul} maxMultiplier={maxMul[key] || 1} />
              );
            })}
            {isTransport(unit) && (
              <div className="flex items-center gap-2 pt-1 border-t border-cyan-400/10">
                <Package className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 w-9 shrink-0">CAP</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800/70 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: '100%' }} />
                </div>
                <span className="text-[10px] font-mono text-amber-200 tabular-nums w-12 text-right">{unit.carryingCapacity}</span>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Factory className="w-3.5 h-3.5 text-amber-300/70" />
              <span className="command-label">Shipyard Requirements</span>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-1.5">Build Cost</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(unit.buildCost).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/50 text-slate-200">
                  {RES_LABELS[k] || k}: <span className="text-cyan-200">{Math.floor(v).toLocaleString()}</span>
                </span>
              ))}
            </div>
          </div>

          {building ? (
            <ConstructionTimer record={unitRecord} onComplete={() => onBuilt?.()} />
          ) : (
            <button
              onClick={build}
              disabled={busy}
              className="w-full rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-slate-900 font-heading text-xs tracking-wide uppercase py-2.5 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {busy ? 'Deploying…' : `Build ${unit.name}`}
            </button>
          )}
          {error && <p className="text-[10px] text-rose-300 mt-1.5 text-center">{error}</p>}

          <UnitUpgradeList unit={unit} unitRecord={unitRecord} unlocked={unlocked} onDone={onBuilt} />
        </>
      ) : (
        <div className="text-center py-6">
          <Lock className="w-5 h-5 text-slate-500 mx-auto mb-2" />
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
            Requires {gatingTech?.name || unit.gatingTechId || 'research'}
          </p>
        </div>
      )}
    </div>
  );
}