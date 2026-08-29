import React from 'react';
import { Ship, Lock } from 'lucide-react';
import { unitClass } from '@/lib/unitClasses';

// A single slim row in the left roster rail. Status is encoded as an LED pip
// (dim = locked, amber = building, green = ready) plus a small text label.
const STATUS = {
  locked: { led: 'led-dim', label: 'Locked', text: 'text-slate-500' },
  building: { led: 'led-amber', label: 'Building', text: 'text-amber-300' },
  ready: { led: 'led-green', label: 'Ready', text: 'text-emerald-300' },
};

export default function UnitRosterRow({ unit, unitRecord, unlocked, selected, onClick }) {
  const owned = unitRecord?.owned_count || 0;
  const building = !!unitRecord?.construction_start_date;
  const status = !unlocked ? 'locked' : building ? 'building' : 'ready';
  const s = STATUS[status];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border ${selected ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-transparent hover:bg-slate-800/40'}`}
    >
      <span className={`led ${s.led}`} />
      <span className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border ${unlocked ? 'border-cyan-400/25 bg-cyan-400/10' : 'border-slate-700/40 bg-slate-800/40'}`}>
        {unlocked ? <Ship className="w-3.5 h-3.5 text-cyan-300" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-heading text-[11px] tracking-wide text-white uppercase truncate">{unit.name}</span>
        <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">{unitClass(unit)}</span>
      </span>
      <span className="text-right shrink-0">
        <span className="block font-mono text-sm font-bold text-cyan-200 tabular-nums leading-none">{unlocked ? owned : '—'}</span>
        <span className={`block text-[8px] uppercase tracking-widest ${s.text}`}>{s.label}</span>
      </span>
    </button>
  );
}