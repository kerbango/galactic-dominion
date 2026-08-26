import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { productionPerHour, BASE_PER_HOUR } from '@/lib/production';
import { Gem, Layers, Zap, Coins, Pickaxe, Users, Loader2 } from 'lucide-react';

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
    <div>
      <p className="text-center text-[0.6rem] font-mono uppercase tracking-widest text-cyan-200/60 mb-1">
        Estimated Production / Hour
      </p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-[5px] md:w-3/5 md:mx-auto">
        {RESOURCES.map((r) => {
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
            <div key={r.key} className="glass-panel rounded-md p-1">
              <Icon className={`w-[14px] h-[14px] ${r.color} mb-[3px]`} />
              <p className="font-mono text-[0.72rem] font-bold text-foreground tabular-nums leading-none">
                +{total}/hr
              </p>
              <p className="text-[0.55rem] uppercase tracking-widest text-muted-foreground mt-[1px]">
                {r.label}
              </p>
              <p className="text-[0.55rem] font-mono text-cyan-300/70 mt-[1px]">
                {BASE_PER_HOUR} base +{tech} tech
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}