import React from 'react';
import TechIcon from './techIcons';
import UnlockBadges from './UnlockBadges';
import { CATEGORIES, isPrimaryTech, getResearchCost } from '@/data/techTree';
import { CATEGORY_THEME } from '@/lib/techLayout';

const STATE_LABEL = {
  researched: 'RESEARCHED',
  available: 'AVAILABLE',
  researching: 'IN PROGRESS',
  locked: 'LOCKED',
};

export default function TechNode({ tech, state, position, selected, onClick, progress }) {
  const primary = isPrimaryTech(tech);
  const cat = CATEGORIES[tech.category];
  const rpCost = getResearchCost(tech)?.research_points || 0;
  const rec = progress;
  const allocated = Math.max(0, Math.min(100, Number(rec?.allocation_percent) || 0));
  const required = Math.max(1, Number(rec?.research_points_required) || rpCost);
  const invested = Math.min(required, Math.max(0, Number(rec?.research_points_invested) || 0));
  const rpPct = required ? Math.min(100, (invested / required) * 100) : 0;
  const theme = CATEGORY_THEME[tech.category] || CATEGORY_THEME['Fleet Research'];
  const iconName = tech.icon || cat?.icon || 'Cpu';
  const locked = state === 'locked';
  const active = state === 'available' || state === 'researching';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        left: position.x,
        top: position.y,
        width: position.w,
        height: position.h,
        '--accent': theme.accent,
        '--bright': theme.bright,
        '--soft': theme.soft,
      }}
      className={`absolute text-left group rounded-xl border backdrop-blur-xl overflow-hidden transition-all duration-200 ${locked ? 'opacity-55 grayscale-[0.35]' : ''} ${active ? 'hover:scale-[1.035] hover:brightness-125' : 'hover:scale-[1.02]'} ${selected ? 'z-30 ring-2 ring-white/80' : 'z-10'}`}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.soft}, rgba(2,7,13,0.94) 70%)` }} />
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${theme.bright}, transparent)` }} />
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: theme.accent, boxShadow: active ? `0 0 12px ${theme.bright}` : 'none' }} />
      {primary && <div className="absolute -inset-px rounded-xl pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${theme.bright}, 0 0 ${active ? 26 : 12}px ${theme.accent}55` }} />}
      {state === 'researching' && <div className="absolute inset-0 pointer-events-none opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${theme.bright}18, transparent)`, animation: 'techScan 1.8s linear infinite' }} />}

      <div className="relative flex items-center h-full gap-2.5 px-3">
        <div className="shrink-0 flex items-center justify-center rounded-lg border bg-black/35" style={{ width: primary ? 42 : 36, height: primary ? 42 : 36, borderColor: `${theme.accent}88`, color: locked ? '#64748b' : theme.bright, boxShadow: active ? `0 0 16px ${theme.accent}30` : 'none' }}>
          <TechIcon name={iconName} className={primary ? 'w-5 h-5' : 'w-[18px] h-[18px]'} />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
            <span className="font-mono text-[8px] uppercase tracking-[0.18em]" style={{ color: locked ? '#64748b' : theme.bright }}>T{tech.tier}</span>
            <span className="font-mono text-[7px] uppercase tracking-widest px-1 rounded-sm" style={{ color: locked ? '#475569' : '#67e8f9', background: locked ? 'rgba(71,85,105,0.12)' : 'rgba(34,211,238,0.10)' }}>{Math.round(rpCost).toLocaleString()} RP</span>
            {primary && <span className="font-mono text-[8px] uppercase tracking-widest text-amber-300">★ PRIMARY</span>}
            {tech.unlockTags?.includes('blacklisted') && <span className="font-mono text-[8px] uppercase tracking-widest text-pink-300">BLACKLISTED</span>}
          </div>
          <p className={`font-heading uppercase tracking-wide leading-tight line-clamp-2 ${primary ? 'text-[11px]' : 'text-[10px]'} ${locked ? 'text-slate-400' : 'text-slate-100'}`}>{tech.name}</p>
          {!locked && <div className="flex items-center gap-1.5 mt-1 min-w-0"><span className="text-[7px] font-mono uppercase tracking-widest" style={{ color: theme.bright }}>{STATE_LABEL[state]}</span><UnlockBadges tags={tech.unlockTags} /></div>}
          {state === 'researching' && <div className="mt-1"><div className="flex items-center justify-between text-[7px] font-mono"><span style={{ color: theme.bright }}>{allocated}% alloc</span><span className="text-slate-400">{Math.floor(rpPct)}%</span></div><div className="mt-0.5 h-[3px] rounded-full bg-slate-900/80 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${rpPct}%`, background: theme.bright }} /></div></div>}
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold" style={{ borderColor: `${theme.accent}99`, color: state === 'researched' ? '#4ade80' : state === 'researching' ? theme.bright : state === 'available' ? '#fbbf24' : '#64748b', background: 'rgba(0,0,0,.3)' }}>
            {state === 'researched' ? '✓' : state === 'researching' ? '◉' : state === 'available' ? '◆' : '🔒'}
          </span>
        </div>
      </div>
    </button>
  );
}