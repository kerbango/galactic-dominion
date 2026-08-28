import React from 'react';
import { Navigate } from 'react-router-dom';
import { Gem, Layers, Zap, Coins, Pickaxe, Users, Loader2, LayoutDashboard, FlaskConical } from 'lucide-react';
import { useEmpire } from '@/lib/EmpireContext';
import ProductionBreakdown from '@/components/console/ProductionBreakdown';
import LowResourceWarning from '@/components/console/LowResourceWarning';
import ActiveResearchPanel from '@/components/research/ActiveResearchPanel';

const RESOURCES = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
  { key: 'research_points', label: 'Research Pts', icon: FlaskConical, color: 'text-fuchsia-300' },
  { key: 'population', label: 'Population', icon: Users, color: 'text-rose-300' },
];

function formatAmount(n) {
  if (n == null) return '0';
  return Math.floor(n).toLocaleString();
}

// Central command hub. Reads the empire from the shared store so treasury
// values stay in sync with trades performed on the Market.
export default function Console() {
  const { empire, loading } = useEmpire();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!empire) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center gap-1 mb-8">
        <LayoutDashboard className="w-7 h-7 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Command Console
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
          {empire.empire_name} · Ruler {empire.ruler_name}
        </p>
      </div>

      {/* Accumulated resources */}
      <h2 className="font-heading text-[0.65rem] tracking-[0.3em] text-cyan-200/80 uppercase mb-1 text-center">Accumulated Resources</h2>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-[5px] mb-2 md:w-4/5 md:mx-auto">
        {RESOURCES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="glass-panel rounded-md p-1">
              <Icon className={`w-[17px] h-[17px] ${r.color} mb-[5px]`} />
              <p className="font-mono text-[0.72rem] font-bold text-foreground tabular-nums leading-none">
                {formatAmount(empire[r.key])}
              </p>
              <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground mt-[1px]">{r.label}</p>
            </div>
          );
        })}
      </div>

      <LowResourceWarning empire={empire} />

      <ProductionBreakdown />

      <h2 className="font-heading text-[0.65rem] tracking-[0.3em] text-cyan-200/80 uppercase mb-2 mt-6 text-center">Active Research</h2>
      <div className="md:w-3/5 md:mx-auto">
        <ActiveResearchPanel />
      </div>

    </div>
  );
}