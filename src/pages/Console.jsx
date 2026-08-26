import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Gem, Layers, Zap, Coins, Loader2, LayoutDashboard } from 'lucide-react';
import ProductionBreakdown from '@/components/console/ProductionBreakdown';

const RESOURCES = [
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
];

function formatAmount(n) {
  if (n == null) return '0';
  return Math.floor(n).toLocaleString();
}

// Central command hub. Shows the empire's accumulated resources and quick
// navigation to the galactic map and profile. Players without an empire are
// sent to the empire-selection (setup) screen.
export default function Console() {
  const [empire, setEmpire] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
        if (active) setEmpire(empires[0] || null);
      } catch {
        if (active) setEmpire(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[5px] mb-2 md:w-3/5 md:mx-auto">
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

      <ProductionBreakdown />

    </div>
  );
}