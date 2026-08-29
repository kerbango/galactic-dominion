import React, { useMemo } from 'react';
import { useEmpire } from '@/lib/EmpireContext';
import {
  totalResearchSpeedBonus,
  researchPointsPerCycle,
  RESEARCH_SPEED_TECH_BONUS,
  upgradeBonusFromLevel,
} from '@/data/techTree';
import { getEmpireUpgrade } from '@/data/empireUpgrades';
import { FlaskConical, Sparkles, Sword, Shield } from 'lucide-react';

// Bonus Dashboard — a summary-first panel showing the player's current
// active empire bonuses as circular gauges: Research Speed, Research Points
// per cycle, Fleet Attack, and Fleet Defense. Values are computed live from
// the empire's upgrade levels AND the completed tech set, so completing a
// tech (e.g. Quantum Computing) or purchasing an upgrade immediately
// updates the gauges. Each gauge also shows a small badge indicating which
// tech-tree contribution is active.

function bonusAtLevel(upgrade, level) {
  if (!level || level <= 0) return 0;
  const tier = upgrade.tiers[level - 1];
  return tier ? tier.bonus : 0;
}

function Gauge({ value, max, display, label, color, icon: Icon, techBadge }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, max > 0 ? value / max : 0);
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>
            {display}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 justify-center">
        <Icon className="w-3 h-3" style={{ color }} />
        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      {techBadge ? (
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/25 text-cyan-200/90 uppercase tracking-wide whitespace-nowrap">
          {techBadge}
        </span>
      ) : (
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-slate-500/20 text-slate-500 uppercase tracking-wide whitespace-nowrap">
          Tech locked
        </span>
      )}
    </div>
  );
}

export default function BonusDashboard({ completedIds }) {
  const { empire } = useEmpire();
  const completed = useMemo(
    () => completedIds instanceof Set ? completedIds : new Set(completedIds || []),
    [completedIds]
  );

  const stats = useMemo(() => {
    const techSpeed = completed.has('quantum_computing') ? RESEARCH_SPEED_TECH_BONUS : 0;
    const upgradeSpeed = upgradeBonusFromLevel(empire?.research_speed_level || 0);
    const speedBonus = techSpeed + upgradeSpeed;
    const rpCycle = researchPointsPerCycle(empire?.research_points_production_level || 0);
    const levels = empire?.empire_upgrade_levels || {};
    const plasma = getEmpireUpgrade('plasma_efficiency');
    const hull2 = getEmpireUpgrade('reinforced_hull_ii');
    const heavyArmor = getEmpireUpgrade('heavy_armor');
    const fleetAttack = plasma ? bonusAtLevel(plasma, levels.plasma_efficiency) : 0;
    const fleetDefense =
      (hull2 ? bonusAtLevel(hull2, levels.reinforced_hull_ii) : 0) +
      (heavyArmor ? bonusAtLevel(heavyArmor, levels.heavy_armor) : 0);
    return { speedBonus, techSpeed, upgradeSpeed, rpCycle, fleetAttack, fleetDefense };
  }, [empire, completed]);

  // Tech-tree contribution badges — show which techs are actively
  // contributing to each gauge. When the gating tech isn't completed yet,
  // the gauge shows "Tech locked" instead.
  const speedBadge = completed.has('quantum_computing')
    ? `QC +${Math.round(RESEARCH_SPEED_TECH_BONUS * 100)}%`
    : null;
  const attackBadge = completed.has('plasma_weapons') ? 'Plasma Focusing ✓' : null;
  const defenseBadge = completed.has('battleship_hull') || completed.has('titan_hull')
    ? [completed.has('battleship_hull') ? 'BH ✓' : null, completed.has('titan_hull') ? 'TH ✓' : null].filter(Boolean).join(' · ')
    : null;

  return (
    <div className="glass-panel-strong rounded-2xl p-4 md:p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <p className="font-heading text-[10px] tracking-[0.2em] text-cyan-200/70 uppercase">Empire Bonus Summary</p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-2">
        <Gauge
          value={stats.speedBonus * 100}
          max={50}
          display={`+${Math.round(stats.speedBonus * 100)}%`}
          label="Research Speed"
          color="#22d3ee"
          icon={FlaskConical}
          techBadge={speedBadge}
        />
        <Gauge
          value={stats.rpCycle}
          max={5}
          display={`${stats.rpCycle}/cyc`}
          label="Research Points"
          color="#e879f9"
          icon={Sparkles}
          techBadge="Base 1/cyc"
        />
        <Gauge
          value={stats.fleetAttack * 100}
          max={20}
          display={`+${Math.round(stats.fleetAttack * 100)}%`}
          label="Fleet Attack"
          color="#fbbf24"
          icon={Sword}
          techBadge={attackBadge}
        />
        <Gauge
          value={stats.fleetDefense * 100}
          max={50}
          display={`+${Math.round(stats.fleetDefense * 100)}%`}
          label="Fleet Defense"
          color="#34d399"
          icon={Shield}
          techBadge={defenseBadge}
        />
      </div>
    </div>
  );
}