import React, { useMemo } from 'react';
import {
  researchPointsPerHour,
  RESEARCH_SPEED_TECH_BONUS,
  upgradeBonusFromLevel,
} from '@/data/techTree';
import { getEmpireUpgrade } from '@/data/empireUpgrades';
import { FlaskConical, Sparkles, Coins, Shield } from 'lucide-react';
import { useEmpire } from '@/lib/EmpireContext';

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
          <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-700" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center"><span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>{display}</span></div>
      </div>
      <div className="flex items-center gap-1 justify-center"><Icon className="w-3 h-3" style={{ color }} /><p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">{label}</p></div>
      {techBadge ? <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/25 text-cyan-200/90 uppercase tracking-wide whitespace-nowrap">{techBadge}</span> : <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-slate-500/20 text-slate-500 uppercase tracking-wide whitespace-nowrap">No upgrades</span>}
    </div>
  );
}

function purchasedBonus(levels, id) {
  const upgrade = getEmpireUpgrade(id);
  return upgrade && levels[id] > 0 ? upgrade.bonus : 0;
}

export default function BonusDashboard({ completedIds }) {
  const { empire } = useEmpire();
  const completed = useMemo(() => completedIds instanceof Set ? completedIds : new Set(completedIds || []), [completedIds]);

  const stats = useMemo(() => {
    const techSpeed = completed.has('quantum_computing') ? RESEARCH_SPEED_TECH_BONUS : 0;
    const upgradeSpeed = upgradeBonusFromLevel(empire?.research_speed_level || 0);
    const speedBonus = techSpeed + upgradeSpeed;
    const rpCycle = researchPointsPerHour(empire?.population || 0);
    const levels = empire?.empire_upgrade_levels || {};
    const incomeIds = ['income_upgrade_i', 'income_upgrade_ii', 'income_upgrade_iii', 'tax_office_i', 'tax_office_ii', 'tax_office_iii'];
    const populationIds = ['population_growth_i', 'population_growth_ii', 'population_growth_iii'];
    const defenseIds = ['empire_defense_control_matrix_i'];
    const incomeBonus = incomeIds.reduce((sum, id) => sum + purchasedBonus(levels, id), 0);
    const populationBonus = populationIds.reduce((sum, id) => sum + purchasedBonus(levels, id), 0);
    const defenseBonus = defenseIds.reduce((sum, id) => sum + purchasedBonus(levels, id), 0);
    return { speedBonus, rpCycle, incomeBonus, populationBonus, defenseBonus };
  }, [empire, completed]);

  const speedBadge = completed.has('quantum_computing') ? `QC +${Math.round(RESEARCH_SPEED_TECH_BONUS * 100)}%` : null;
  const incomeBadge = stats.incomeBonus > 0 ? `+${Math.round(stats.incomeBonus * 100)}%` : null;
  const populationBadge = stats.populationBonus > 0 ? `+${Math.round(stats.populationBonus * 100)}%` : null;
  const defenseBadge = stats.defenseBonus > 0 ? `+${Math.round(stats.defenseBonus * 100)}%` : null;

  return (
    <div className="glass-panel-strong rounded-2xl p-4 md:p-5 mb-4">
      <div className="flex items-center gap-2 mb-4"><div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" /><p className="font-heading text-[10px] tracking-[0.2em] text-cyan-200/70 uppercase">Empire Bonus Summary</p><div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" /></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-2">
        <Gauge value={stats.speedBonus * 100} max={50} display={`+${Math.round(stats.speedBonus * 100)}%`} label="Research Speed" color="#22d3ee" icon={FlaskConical} techBadge={speedBadge} />
        <Gauge value={stats.rpCycle} max={50} display={`${stats.rpCycle}/hr`} label="Research Points" color="#e879f9" icon={Sparkles} techBadge="Pop-driven" />
        <Gauge value={stats.incomeBonus * 100} max={50} display={`+${Math.round(stats.incomeBonus * 100)}%`} label="VRIND Income" color="#fbbf24" icon={Coins} techBadge={incomeBadge} />
        <Gauge value={stats.populationBonus * 100} max={30} display={`+${Math.round(stats.populationBonus * 100)}%`} label="Population" color="#a78bfa" icon={Sparkles} techBadge={populationBadge} />
        <Gauge value={stats.defenseBonus * 100} max={30} display={`+${Math.round(stats.defenseBonus * 100)}%`} label="Empire Defense" color="#34d399" icon={Shield} techBadge={defenseBadge} />
      </div>
    </div>
  );
}