import React, { useState, useMemo } from 'react';
import { Shield, Building2, Footprints, FlaskConical, ChevronDown, ChevronUp, ShieldHalf } from 'lucide-react';
import { computePlanetDefenseBreakdown } from '@/data/planetDefense';

// Defense Dashboard — a clear breakdown of the player's Planet Defense
// Rating showing exactly how much protection comes from each source:
// base fortification, defensive structures, garrison troops, and research.
// Expandable to reveal per-unit contributor detail.

const CATEGORIES = [
  { key: 'base', label: 'Base Fortification', icon: Shield, color: 'text-slate-300', bar: 'bg-slate-500', glow: 'shadow-[0_0_8px_rgba(100,116,139,0.5)]', desc: 'Inherent planetary resistance' },
  { key: 'structures', label: 'Defensive Structures', icon: Building2, color: 'text-emerald-300', bar: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]', desc: 'Bunkers, cannons, platforms' },
  { key: 'garrison', label: 'Stationed Units', icon: Footprints, color: 'text-cyan-300', bar: 'bg-cyan-500', glow: 'shadow-[0_0_8px_rgba(6,182,212,0.5)]', desc: 'Ground troops in garrison' },
  { key: 'research', label: 'Research', icon: FlaskConical, color: 'text-violet-300', bar: 'bg-violet-500', glow: 'shadow-[0_0_8px_rgba(139,92,246,0.5)]', desc: 'Empire upgrade bonuses' },
];

export default function DefenseDashboard({ empire, unitRecords }) {
  const [expanded, setExpanded] = useState(false);

  const breakdown = useMemo(
    () => computePlanetDefenseBreakdown(empire, unitRecords),
    [empire, unitRecords]
  );

  const { total, structureContributors, garrisonContributors } = breakdown;
  const max = Math.max(1, total);

  return (
    <div className="glass-panel-strong rounded-2xl p-4 md:p-5 mb-4">
      {/* Header + total */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-emerald-400/30 bg-emerald-400/10">
            <ShieldHalf className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="font-heading text-sm md:text-base tracking-[0.15em] text-white uppercase">
              Planet Defense Dashboard
            </h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-200/60">
              Total Protection Rating
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl md:text-3xl font-bold text-emerald-100 tabular-nums leading-none">
            {total.toLocaleString()}
          </p>
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-0.5">
            Defense Points
          </p>
        </div>
      </div>

      {/* Stacked proportion bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-black/50 border border-white/5 mb-4">
        {CATEGORIES.map(({ key, bar, glow }) => {
          const val = breakdown[key];
          if (val <= 0) return null;
          const pct = (val / max) * 100;
          return (
            <div
              key={key}
              className={`${bar} ${glow} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${key}: ${val.toLocaleString()}`}
            />
          );
        })}
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {CATEGORIES.map(({ key, label, icon: Icon, color, desc }) => {
          const val = breakdown[key];
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div key={key} className="glass-panel rounded-lg p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <p className={`text-[9px] font-mono uppercase tracking-widest ${color}`}>{label}</p>
              </div>
              <p className={`font-mono text-lg font-bold tabular-nums ${color}`}>
                {val.toLocaleString()}
                <span className="text-[10px] text-muted-foreground/60 ml-1 font-normal">({pct}%)</span>
              </p>
              <p className="text-[9px] text-muted-foreground/60 leading-tight">{desc}</p>
            </div>
          );
        })}
      </div>

      {/* Expandable contributor detail */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-cyan-200/70 hover:text-cyan-200 transition-colors py-1"
      >
        {expanded ? (
          <><ChevronUp className="w-3 h-3" /> Hide Breakdown</>
        ) : (
          <><ChevronDown className="w-3 h-3" /> View Detailed Breakdown</>
        )}
      </button>

      {expanded && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Structures list */}
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-200/80">
                Defensive Structures
              </p>
            </div>
            {structureContributors.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/50 py-2">
                No defensive structures built. Research Planetary Fortifications to unlock them.
              </p>
            ) : (
              <div className="space-y-1.5">
                {structureContributors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-200 truncate pr-2">
                      {c.name} <span className="text-muted-foreground/60">×{c.count}</span>
                    </span>
                    <span className="text-emerald-300 font-bold tabular-nums shrink-0">
                      +{c.contribution.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Garrison list */}
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Footprints className="w-3.5 h-3.5 text-cyan-300" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/80">
                Garrison Forces
              </p>
            </div>
            {garrisonContributors.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/50 py-2">
                No ground troops stationed. Build infantry and keep them home to raise defense.
              </p>
            ) : (
              <div className="space-y-1.5">
                {garrisonContributors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-200 truncate pr-2">
                      {c.name} <span className="text-muted-foreground/60">×{c.count}</span>
                    </span>
                    <span className="text-cyan-300 font-bold tabular-nums shrink-0">
                      +{c.contribution.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}