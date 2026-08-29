import React from 'react';

// One horizontal diagnostic stat bar for the unit detail panel. The fill is
// scaled against a nominal max (2.0) so base-1 stats sit at half and
// upgraded stats grow visibly. The raw effective value is shown as a
// tabular number on the right.
const STAT_COLORS = {
  attack: 'bg-rose-400', defense: 'bg-sky-400', stealth: 'bg-violet-400',
  exploration: 'bg-emerald-400', shielding: 'bg-cyan-400', hull_armor: 'bg-stone-300',
  speed: 'bg-amber-400', range: 'bg-orange-400', efficiency: 'bg-yellow-400',
};

export default function StatBar({ stat, value, label, icon: Icon, max = 2 }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = STAT_COLORS[stat] || 'bg-cyan-400';
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 w-9 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-800/70 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-200 tabular-nums w-9 text-right">{value.toFixed(2)}</span>
    </div>
  );
}