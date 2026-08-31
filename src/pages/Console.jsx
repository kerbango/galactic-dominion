import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Gem, Layers, Zap, Coins, Pickaxe, Users, Loader2, LayoutDashboard, FlaskConical, Shield, Factory, Radar, ArrowRight, Activity } from 'lucide-react';
import { useEmpire } from '@/lib/EmpireContext';
import ProductionBreakdown from '@/components/console/ProductionBreakdown';
import LowResourceWarning from '@/components/console/LowResourceWarning';
import PlanetDefenseRating from '@/components/console/PlanetDefenseRating';
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

  const primaryResources = RESOURCES.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Command header */}
      <div className="glass-panel-strong rounded-2xl p-4 md:p-5 mb-4 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <p className="command-label">Imperial Command Network · Online</p>
              <h1 className="font-heading text-xl md:text-2xl tracking-[0.08em] text-white uppercase truncate">{empire.empire_name}</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/55">Ruler {empire.ruler_name} · Strategic Command Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:border-l md:border-cyan-400/10 md:pl-5">
            <span className="command-status">Systems nominal</span>
          </div>
        </div>
        <div className="hud-divider mt-4" />
        <div className="scanline-overlay" />
      </div>

      {/* Sticky command bar */}
      <div className="sticky top-2 z-10 glass-panel-strong rounded-xl px-4 py-2.5 mb-4 flex items-center gap-4">
        <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-slate-400"><Coins className="w-3 h-3 text-cyan-300" /> VRIND <span className="text-cyan-200">{formatAmount(empire.vrind)}</span></span>
          <span className="flex items-center gap-1.5 text-slate-400"><Zap className="w-3 h-3 text-amber-300" /> Energy <span className="text-amber-300">{formatAmount(empire.energy)}</span></span>
          <span className="flex items-center gap-1.5 text-slate-400"><FlaskConical className="w-3 h-3 text-fuchsia-300" /> RP <span className="text-fuchsia-300">{formatAmount(empire.research_points)}</span></span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400"><Users className="w-3 h-3 text-rose-300" /> Pop <span className="text-rose-300">{formatAmount(empire.population)}</span></span>
        </div>
        <span className="ml-auto command-status">Systems nominal</span>
      </div>

      {/* Treasury */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <p className="command-label">Imperial Treasury</p>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Available reserves</p>
        </div>
        <Activity className="w-4 h-4 text-cyan-300/50" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
        {primaryResources.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="glass-panel rounded-xl p-3 min-h-[82px]">
              <div className="flex items-center justify-between gap-2">
                <Icon className={`w-4 h-4 ${r.color}`} />
                <span className="led led-green" />
              </div>
              <p className="font-mono text-lg font-bold text-foreground tabular-nums leading-none mt-3">{formatAmount(empire[r.key])}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1 truncate">{r.label}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary empire vitals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {RESOURCES.slice(5).map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="glass-panel rounded-lg px-3 py-2 flex items-center gap-3">
              <Icon className={`w-4 h-4 ${r.color}`} />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">{r.label}</p>
                <p className="font-mono text-sm font-bold tabular-nums">{formatAmount(empire[r.key])}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accumulated resources */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <Factory className="w-3.5 h-3.5 text-cyan-300/60" />
        <h2 className="command-label">Production Network</h2>
      </div>
      <ProductionBreakdown />

      <LowResourceWarning empire={empire} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Shield className="w-3.5 h-3.5 text-emerald-300/70" />
            <h2 className="command-label">Planetary Security</h2>
          </div>
          <PlanetDefenseRating />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <FlaskConical className="w-3.5 h-3.5 text-fuchsia-300/70" />
            <h2 className="command-label">Research Operations</h2>
          </div>
          <ActiveResearchPanel />
        </section>
      </div>

      <div className="glass-panel rounded-xl px-4 py-3 mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Radar className="w-4 h-4 text-cyan-300" />
          <div>
            <p className="command-label">Strategic Network</p>
            <p className="text-xs text-muted-foreground">Command systems synchronized. Review the Galactic Map for fleet movements and sector activity.</p>
          </div>
        </div>
        <Link to="/map" className="command-btn rounded-lg px-3 py-2 text-[10px] font-heading uppercase tracking-widest inline-flex items-center justify-center gap-2 whitespace-nowrap">
          Open Tactical Map <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}