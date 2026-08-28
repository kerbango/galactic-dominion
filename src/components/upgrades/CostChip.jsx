import React from 'react';
import { Gem, Layers, Zap, Coins, Pickaxe } from 'lucide-react';

const RES_ICONS = {
  aetherium_crystal: { Icon: Gem, color: 'text-violet-300' },
  ferrite_titanium: { Icon: Layers, color: 'text-slate-300' },
  energy: { Icon: Zap, color: 'text-amber-300' },
  vrind: { Icon: Coins, color: 'text-cyan-300' },
  berentium: { Icon: Pickaxe, color: 'text-emerald-300' },
};

// A single resource cost chip: small lucide resource icon + value, in the
// copper-bordered pcb-cost pill. Replaces the old text-label chips.
export default function CostChip({ resourceKey, value }) {
  const cfg = RES_ICONS[resourceKey] || { Icon: Coins, color: 'text-slate-300' };
  const Icon = cfg.Icon;
  return (
    <span className="pcb-cost text-[10px] font-mono px-2 py-1 rounded inline-flex items-center gap-1">
      <Icon className={`w-3 h-3 ${cfg.color}`} />
      <span className="text-cyan-300">{Math.floor(value).toLocaleString()}</span>
    </span>
  );
}