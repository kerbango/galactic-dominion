import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { productionPerHour, BASE_PER_HOUR } from '@/lib/production';
import { Gem, Layers, Zap, Coins, Pickaxe, Loader2, TrendingUp } from 'lucide-react';

const RESOURCES = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
];

export default function ProductionBreakdown() {
  const [rates, setRates] = useState(null);

  const load = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      const [completed, empires] = await Promise.all([
        base44.entities.TechProgress.filter({ created_by_id: user.id, status: 'completed' }),
        base44.entities.Empire.filter({ created_by_id: user.id }),
      ]);
      if (empires[0]) setRates(productionPerHour(completed, empires[0]));
      else setRates(null);
    } catch {
      setRates(null);
    }
  }, []);

  useEffect(() => {
    load();

    // Research completion and upgrade purchases are both reflected immediately
    // through their entity subscriptions instead of waiting for a page reload.
    const unsubTech = base44.entities.TechProgress.subscribe(() => load());
    const unsubEmpire = base44.entities.Empire.subscribe(() => load());
    const poll = setInterval(load, 60000);

    return () => {
      unsubTech();
      unsubEmpire();
      clearInterval(poll);
    };
  }, [load]);

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
        {RESOURCES.map((r) => {
          const Icon = r.icon;
          const total = rates[r.key] ?? BASE_PER_HOUR;
          const tech = total - BASE_PER_HOUR;
          return (
            <div key={r.key} className="rounded-lg border border-cyan-400/10 bg-slate-950/30 p-2.5 hover:border-cyan-400/25 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <Icon className={`w-4 h-4 ${r.color}`} />
                <span className="text-[9px] font-mono text-cyan-300/65">/ HR</span>
              </div>
              <p className="font-mono text-base font-bold text-foreground tabular-nums leading-none mt-3">
                +{Number.isInteger(total) ? total.toLocaleString() : total.toFixed(2)}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1 truncate">{r.label}</p>
              <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400/60" style={{ width: `${Math.min(100, Math.max(8, (Math.max(0, tech) / Math.max(total, 1)) * 100))}%` }} />
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">
                {BASE_PER_HOUR} base · {tech >= 0 ? '+' : ''}{Number.isInteger(tech) ? tech.toLocaleString() : tech.toFixed(2)} research/upgrades
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
