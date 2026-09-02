import React from 'react';
import TechIcon from './techIcons';
import UnlockBadges from './UnlockBadges';
import { CATEGORIES, isPrimaryTech } from '@/data/techTree';

const STATE_STYLES = {
  researched: {
    border: 'border-emerald-400/90',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.24)]',
    bg: 'bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(2,7,13,0.82))]',
    icon: 'text-emerald-300',
    text: 'text-emerald-50',
    label: 'COMPLETE',
    labelColor: 'text-emerald-300',
    ring: 'ring-emerald-300/60',
    pin: 'text-emerald-400',
  },
  available: {
    border: 'border-amber-400/90',
    glow: 'shadow-[0_0_22px_rgba(245,158,11,0.28)]',
    bg: 'bg-[linear-gradient(135deg,rgba(245,158,11,0.13),rgba(2,7,13,0.86))]',
    icon: 'text-amber-300',
    text: 'text-amber-50',
    label: 'AVAILABLE',
    labelColor: 'text-amber-300',
    ring: 'ring-amber-300/70',
    pin: 'text-amber-400',
  },
  locked: {
    border: 'border-slate-600/70',
    glow: '',
    bg: 'bg-[linear-gradient(135deg,rgba(30,41,59,0.48),rgba(2,7,13,0.88))]',
    icon: 'text-slate-500 grayscale opacity-75',
    text: 'text-slate-300',
    label: 'LOCKED',
    labelColor: 'text-slate-500',
    ring: 'ring-cyan-400/40',
    pin: 'text-slate-600',
  },
  researching: {
    border: 'border-cyan-300/90',
    glow: 'shadow-[0_0_24px_rgba(34,211,238,0.35)]',
    bg: 'bg-[linear-gradient(135deg,rgba(34,211,238,0.13),rgba(2,7,13,0.84))]',
    icon: 'text-cyan-200',
    text: 'text-white',
    label: 'IN PROGRESS',
    labelColor: 'text-cyan-300',
    ring: 'ring-cyan-300/80',
    pin: 'text-cyan-300',
  },
};

export default function TechNode({ tech, state, position, selected, onClick }) {
  const s = STATE_STYLES[state] || STATE_STYLES.locked;
  const primary = isPrimaryTech(tech);
  const cat = CATEGORIES[tech.category];
  const iconName = tech.icon || cat?.icon || 'Cpu';
  const compact = position.w < 125;
  const narrow = position.w < 150;
  const dotCount = primary ? 8 : 6;

  const renderPins = (edgeClass) => (
    <div className={`absolute left-2 right-2 ${edgeClass} flex justify-between pointer-events-none ${s.pin}`}>
      {Array.from({ length: dotCount }).map((_, i) => <span key={i} className="w-[3px] h-[3px] rounded-full bg-current opacity-70" />)}
    </div>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: position.x, top: position.y, width: position.w, height: position.h }}
      className={`absolute text-left rounded-[10px] border ${s.border} ${s.glow} ${s.bg} backdrop-blur-md px-2.5 py-1.5 overflow-hidden transition-all duration-150 hover:z-20 hover:scale-[1.025] hover:brightness-125 ${selected ? `z-20 ring-2 ${s.ring}` : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-cyan-200/25" />
      <div className="absolute inset-y-1 left-0 w-px bg-white/10" />
      {renderPins('top-0 -translate-y-1/2')}
      {renderPins('bottom-0 translate-y-1/2')}
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'} h-full min-w-0`}>
        <div className={`${compact ? 'w-6 h-6' : narrow ? 'w-7 h-7' : 'w-8 h-8'} shrink-0 rounded-md border border-white/10 bg-black/20 flex items-center justify-center ${s.icon}`}>
          <TechIcon name={iconName} className={compact ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} />
        </div>
        <div className="min-w-0 flex-1 h-full flex flex-col justify-center">
          {!compact && <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">T{tech.tier}</span>
            {primary && <span className="font-mono text-[8px] text-amber-300">★ PRIMARY</span>}
            <UnlockBadges tags={tech.unlockTags} />
          </div>}
          {compact && <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-slate-500">T{tech.tier}</span>}
          <p className={`font-heading ${primary ? (compact ? 'text-[9px]' : 'text-[12px]') : (compact ? 'text-[8px]' : 'text-[10px]')} tracking-wide ${s.text} uppercase leading-tight line-clamp-2`}>{tech.name}</p>
        </div>
        <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
          {state === 'locked' ? <span className="text-[10px] text-slate-600">🔒</span> : <span className={`${compact ? 'text-[7px]' : 'text-[8px]'} font-mono uppercase tracking-widest ${s.labelColor}`}>{state === 'researched' ? '✓' : state === 'researching' ? '◉' : '◆'}</span>}
          {!compact && <span className="text-[8px] font-mono uppercase tracking-widest whitespace-nowrap text-slate-500">{state === 'researched' ? 'COMPLETE' : `${tech.researchTurns || 1} TURNS`}</span>}
        </div>
      </div>
    </button>
  );
}
