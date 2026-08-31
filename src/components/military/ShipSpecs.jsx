import React, { useState } from 'react';
import { Package, Crosshair, ChevronDown, ChevronUp } from 'lucide-react';
import { unitClassLabel, unitRole } from '@/lib/unitClasses';
import { getStatDisplay, isTransport, transportCapacity } from '@/lib/unitStats';
import { unitStatMultipliers, upgradesForUnit } from '@/data/unitUpgrades';
import StatBar from './StatBar';

const STAT_TOOLTIP = {
  attack: 'Raw offensive output.', defense: 'Resistance to incoming fire.',
  stealth: 'Ability to evade detection.', exploration: 'Sensor and survey range.',
  shielding: 'Energy shield strength.', hull_armor: 'Physical armor plating.',
  speed: 'Sublight velocity.', range: 'Effective weapon reach.',
  efficiency: 'Operational efficiency.', armor: 'Ground unit armor.',
  defense_rating: 'Defensive structure rating.',
};

// Right panel: technical specifications. Shows class/role, combat stat bars
// (base × per-type upgrade multipliers), and a systems section with special
// capabilities (e.g. transport capacity). Stats come straight from the unit
// dataset — no invented values.
export default function ShipSpecs({ unit, unitRecord, unlocked, className = '' }) {
  const [systemsOpen, setSystemsOpen] = useState(true);

  if (!unit) {
    return <div className={`glass-panel-strong rounded-2xl p-6 text-center text-slate-500 text-sm ${className}`}>No hull selected.</div>;
  }

  const multipliers = unitStatMultipliers(unit.id, unitRecord?.upgrade_levels || {});
  const upgrades = upgradesForUnit(unit.id);
  const maxMul = {};
  for (const up of upgrades) maxMul[up.stat] = 1 + up.perLevel * up.maxLevel;
  const statDisplay = getStatDisplay(unit);
  const owned = unitRecord?.owned_count || 0;

  return (
    <div className={`glass-panel-strong rounded-2xl p-4 flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-cyan-400/10">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-300/70" />
          <p className="command-label">Technical Specifications</p>
        </div>
        {unlocked && <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/50">×{owned}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="glass-panel rounded-lg p-2">
          <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Class</p>
          <p className="font-heading text-[11px] uppercase tracking-wide text-cyan-100">{unitClassLabel(unit)}</p>
        </div>
        <div className="glass-panel rounded-lg p-2">
          <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Role</p>
          <p className="font-heading text-[11px] uppercase tracking-wide text-violet-200">{unitRole(unit)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="w-3.5 h-3.5 text-cyan-300/60" />
        <p className="command-label">Combat Systems</p>
      </div>
      <div className="space-y-1.5 mb-4">
        {statDisplay.map(({ key, icon, label }) => {
          const base = unit.baseStats[key] ?? 0;
          const mul = multipliers[key] || 1;
          return (
            <StatBar
              key={key}
              stat={key}
              icon={icon}
              label={label}
              value={base * mul}
              base={base}
              multiplier={mul}
              maxMultiplier={maxMul[key] || 1}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setSystemsOpen((o) => !o)}
        className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-cyan-200/80 hover:text-cyan-100 py-1"
      >
        <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Systems</span>
        {systemsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {systemsOpen && (
        <div className="mt-2 space-y-1.5">
          {statDisplay.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 uppercase tracking-widest" title={STAT_TOOLTIP[key] || ''}>{label}</span>
              <span className="text-slate-200 tabular-nums">{unit.baseStats[key] ?? 0}</span>
            </div>
          ))}
          {isTransport(unit) && (
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-cyan-400/10">
              <span className="text-amber-300 uppercase tracking-widest">Troop Cap</span>
              <span className="text-amber-200 tabular-nums">{transportCapacity(unit, owned)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}