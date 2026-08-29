import React from 'react';

// One horizontal diagnostic stat bar for the unit detail panel. The fill is
// a hybrid: a compressed baseline segment from the ship's base stat (modest,
// capped so even high base values only fill the first ~30%) plus an upgrade
// segment that grows as per-type upgrade levels are purchased. The raw
// effective value (base × multiplier) is shown as a tabular number on the right.
const STAT_COLORS = {
  attack: 'bg-rose-400', defense: 'bg-sky-400', stealth: 'bg-violet-400',
  exploration: 'bg-emerald-400', shielding: 'bg-cyan-400', hull_armor: 'bg-stone-300',
  speed: 'bg-amber-400', range: 'bg-orange-400', efficiency: 'bg-yellow-400',
  armor: 'bg-amber-500', defense_rating: 'bg-emerald-400',
};

const BASE_CAP = 30; // baseline segment occupies at most the first 30% of the bar

export default function StatBar({ stat, value, label, icon: Icon, base = 0, multiplier = 1, maxMultiplier = 1 }) {
  const baselinePct = Math.min(BASE_CAP, Math.sqrt(Math.max(0, base)) * 3);
  const upgradeRoom = 100 - BASE_CAP;
  const upgradeRange = Math.max(0.0001, maxMultiplier - 1);
  const upgradePct = maxMultiplier > 1
    ? Math.min(upgradeRoom, ((multiplier - 1) / upgradeRange) * upgradeRoom)
    : 0;
  const pct = Math.min(100, baselinePct + upgradePct);
  const color = STAT_COLORS[stat] || 'bg-cyan-400';
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 w-9 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-800/70 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-200 tabular-nums w-12 text-right">{value.toFixed(2)}</span>
    </div>
  );
}