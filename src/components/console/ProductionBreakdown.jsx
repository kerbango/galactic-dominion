import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { productionPerHour, BASE_PER_HOUR } from '@/lib/production';
import { Gem, Layers, Zap, Coins, Pickaxe, Users, Loader2, TrendingUp } from 'lucide-react';

const RESOURCES = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
  { key: 'population', label: 'Population', icon: Users, color: 'text-rose-300', static: true },
];

export default function ProductionBreakdown() {
  const [rates, setRates] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const completed = await base44.entities.TechProgress.filter({
          created_by_id: user.id,
          status: 'completed',
        });
        if (active) setRates(productionPerHour(completed));
      } catch {
        if (active) setRates(null);
      }
    };
    load();
  }, []);

  if (!rates) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel-strong rounded-xl p-3 md:p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-300" />
          <div>
            <p className="command-label">Production Output</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Estimated yield per hour</p>
          </div>
        </div>
        <span className="command-status">Live estimate</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {RESOURCES.filter((r) => !r.static).map((r) => {
          const Icon = r.icon;
          if (r.static) {
            return (
              <div key={r.key} className="glass-panel rounded-md p-1">
                <Icon className={`w-[14px] h-[14px] ${r.color} mb-[3px]`} />
                <p className="font-mono text-[0.72rem] font-bold text-muted-foreground tabular-nums leading-none">
                  —
                </p>
                <p className="text-[0.55rem] uppercase tracking-widest text-muted-foreground mt-[1px]">
                  {r.label}
                </p>
                <p className="text-[0.55rem] font-mono text-muted-foreground/60 mt-[1px]">
                  Static
                </p>
              </div>
            );
          }
          const total = rates[r.key] || BASE_PER_HOUR;
          const tech = total - BASE_PER_HOUR;
          return (
            <div key={r.key} className="rounded-lg border border-cyan-400/10 bg-slate-950/30 p-2.5 hover:border-cyan-400/25 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <Icon className={`w-4 h-4 ${r.color}`} />
                <span className="text-[9px] font-mono text-cyan-300/65">/ HR</span>
              </div>
              <p className="font-mono text-base font-bold text-foreground tabular-nums leading-none mt-3">
                +{total}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1 truncate">{r.label}</p>
              <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400/60" style={{ width: `${Math.min(100, Math.max(8, (tech / Math.max(total, 1)) * 100))}%` }} />
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">{BASE_PER_HOUR} base · +{tech} tech</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}