import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Layers, Gem, Zap, Coins, Pickaxe, Users, Loader2 } from 'lucide-react';

const RESOURCES = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
  { key: 'population', label: 'Population', icon: Users, color: 'text-rose-300' },
];

function fmt(n) {
  if (n == null) return '0';
  return Math.floor(n).toLocaleString();
}

// "Available Resources" box grid shown at the top of the market pages so
// players can see their treasury before trading. Loads the player's empire.
export default function AvailableResources() {
  const [empire, setEmpire] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await base44.entities.Empire.list('-created_date', 1);
        if (active) setEmpire(list[0] || null);
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!empire) {
    return (
      <p className="text-center text-xs text-muted-foreground mb-6">
        No empire found — found your empire first to trade.
      </p>
    );
  }

  return (
    <div className="mb-8">
      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-cyan-200/70 mb-3">Available Resources</p>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {RESOURCES.map((r) => {
          const Ic = r.icon;
          return (
            <div key={r.key} className="glass-panel rounded-lg p-3 text-center">
              <Ic className={`w-4 h-4 ${r.color} mx-auto mb-1.5`} />
              <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt(empire[r.key])}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{r.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}