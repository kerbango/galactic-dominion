import React from 'react';
import { Ship, Lock, Package, Footprints, Building2, ChevronRight } from 'lucide-react';
import { unitClass } from '@/lib/unitClasses';

// A single slim row in the left roster rail. Status is encoded as an LED pip
// (dim = locked, amber = building, green = ready) plus a small text label.
const STATUS = {
  locked: { led: 'led-dim', label: 'Locked', text: 'text-slate-500' },
  building: { led: 'led-amber', label: 'Building', text: 'text-amber-300' },
  ready: { led: 'led-green', label: 'Ready', text: 'text-emerald-300' },
};

const CATEGORY_ICON = {
  ship: Ship, transport: Package, ground: Footprints, defense: Building2,
};

export default function UnitRosterRow({ unit, unitRecord, unlocked, selected, onClick }) {
  const owned = unitRecord?.owned_count || 0;
  const building = !!unitRecord?.construction_start_date;
  const status = !unlocked ? 'locked' : building ? 'building' : 'ready';
  const s = STATUS[status];
  const CatIcon = CATEGORY_ICON[unit.category || 'ship'] || Ship;
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all border ${selected ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[inset_2px_0_0_rgba(56,189,248,0.75),0_0_18px_rgba(56,189,248,0.06)]' : 'border-transparent hover:border-cyan-400/15 hover:bg-slate-800/40'}`}
    >
      <span className={`led ${s.led}`} />
      <span className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border ${unlocked ? 'border-cyan-400/25 bg-cyan-400/10' : 'border-slate-700/40 bg-slate-800/40'}`}>
        {unlocked ? <CatIcon className="w-3.5 h-3.5 text-cyan-300" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-heading text-[11px] tracking-wide text-white uppercase truncate">{unit.name}</span>
        <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">{unitClass(unit)}</span>
      </span>
      <span className="text-right shrink-0 flex items-center gap-1.5">
        <span><span className="block font-mono text-sm font-bold text-cyan-200 tabular-nums leading-none">{unlocked ? owned : '—'}</span>
        <span className={`block text-[8px] uppercase tracking-widest ${s.text}`}>{s.label}</span></span>
        <ChevronRight className={`w-3 h-3 transition-transform ${selected ? 'text-cyan-300 translate-x-0.5' : 'text-slate-700 group-hover:text-cyan-300'}`} />
      </span>
    </button>
  );
}