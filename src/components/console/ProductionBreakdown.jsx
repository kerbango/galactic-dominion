import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TECH_TREE } from '@/data/techTree';
import { Gem, Layers, Zap, Coins, Loader2 } from 'lucide-react';

// Each completed tech in a category adds +1/hr to its mapped resource. This
// ties the player's research progression directly to their economy.
const CATEGORY_TO_RESOURCE = {
  Energy: 'energy',
  Construction: 'ferrite_titanium',
  Computing: 'aetherium_crystal',
  Propulsion: 'energy',
  Industry: 'ferrite_titanium',
  Weapons: 'ferrite_titanium',
  Biotechnology: 'aetherium_crystal',
  Economics: 'vrind',
  Military: 'vrind',
  'Ship Technology': 'ferrite_titanium',
  Terraforming: 'aetherium_crystal',
  Automation: 'energy',
};

// Base production per hour from the production cycle (+1 of every resource
// per cycle). Cycle is 1 minute during testing → 60/hr.
const BASE_PER_HOUR = 60;

const RESOURCES = [
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
];

const TECH_CATEGORY = new Map(TECH_TREE.map((t) => [t.id, t.category]));

export default function ProductionBreakdown() {
  const [bonus, setBonus] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const completed = await base44.entities.TechProgress.filter({
          created_by_id: user.id,
          status: 'completed',
        });
        if (!active) return;
        const counts = { aetherium_crystal: 0, ferrite_titanium: 0, energy: 0, vrind: 0 };
        for (const tp of completed) {
          const cat = TECH_CATEGORY.get(tp.tech_id);
          const res = cat ? CATEGORY_TO_RESOURCE[cat] : null;
          if (res) counts[res] += 1;
        }
        setBonus(counts);
      } catch {
        if (active) setBonus(null);
      }
    };
    load();
  }, []);

  if (!bonus) {
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[5px] md:w-3/5 md:mx-auto">
        {RESOURCES.map((r) => {
          const Icon = r.icon;
          const b = bonus[r.key] || 0;
          const total = BASE_PER_HOUR + b;
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
                {BASE_PER_HOUR} base +{b} tech
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}