import React from 'react';
import TechIcon from './techIcons';
import { CATEGORIES, isPrimaryTech } from '@/data/techTree';

// Visual state is driven entirely by the derived state string — no per-tech
// logic. Tailwind classes are literal strings so the purge step keeps them.
const STATE_STYLES = {
  researched: {
    border: 'border-emerald-500/80',
    glow: 'shadow-[0_0_16px_rgba(34,197,94,0.4)]',
    bg: 'bg-emerald-500/5',
    icon: '',
    text: 'text-emerald-50',
    label: 'Researched',
    labelColor: 'text-emerald-400',
    ring: 'ring-cyan-400/70',
    pin: 'text-emerald-400',
  },
  available: {
    border: 'border-cyan-400/80',
    glow: 'shadow-[0_0_16px_rgba(34,211,238,0.4)]',
    bg: 'bg-cyan-400/5',
    icon: '',
    text: 'text-cyan-50',
    label: 'Available',
    labelColor: 'text-cyan-300',
    ring: 'ring-cyan-400/70',
    pin: 'text-cyan-400',
  },
  locked: {
    border: 'border-slate-600/60',
    glow: '',
    bg: 'bg-slate-950/60',
    icon: 'grayscale brightness-75 opacity-60',
    text: 'text-slate-400',
    label: 'Locked',
    labelColor: 'text-slate-500',
    ring: 'ring-cyan-400/40',
    pin: 'text-slate-600',
  },
  researching: {
    border: 'border-slate-200/80',
    glow: 'shadow-[0_0_20px_rgba(226,232,240,0.5)]',
    bg: 'bg-slate-200/5',
    icon: '',
    text: 'text-slate-100',
    label: 'Researching',
    labelColor: 'text-slate-200',
    ring: 'ring-cyan-400/70',
    pin: 'text-slate-200',
  },
};

export default function TechNode({ tech, state, position, selected, onClick }) {
  const s = STATE_STYLES[state] || STATE_STYLES.locked;
  const primary = isPrimaryTech(tech);
  const cat = CATEGORIES[tech.category];
  const iconName = tech.icon || cat?.icon || 'Cpu';
  const w = position.w;
  const h = position.h;
  const dotCount = primary ? 8 : 6;

  const renderPins = (edgeClass) => (
    <div className={`absolute left-2 right-2 ${edgeClass} flex justify-between pointer-events-none ${s.pin}`}>
      {Array.from({ length: dotCount }).map((_, i) => (
        <span key={i} className="w-[3px] h-[3px] rounded-full bg-current opacity-80" />
      ))}
    </div>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: position.x, top: position.y, width: w, height: h }}
      className={`absolute text-left rounded-md border ${s.border} ${s.glow} ${s.bg} backdrop-blur-md px-2 py-1 transition-transform hover:z-20 hover:scale-[1.03] ${selected ? `z-20 ring-2 ${s.ring}` : ''}`}
    >
      {renderPins('top-0 -translate-y-1/2')}
      {renderPins('bottom-0 translate-y-1/2')}
      <div className="flex items-center gap-1.5">
        <TechIcon name={iconName} className={`w-3.5 h-3.5 shrink-0 ${cat?.color || 'text-slate-300'} ${s.icon}`} />
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400/80">T{tech.tier}</span>
        {primary && <span className="font-mono text-[8px] uppercase tracking-widest text-amber-300/80">★</span>}
        <span className={`ml-auto font-mono text-[8px] uppercase tracking-widest ${s.labelColor}`}>{s.label}</span>
      </div>
      <p className={`font-heading ${primary ? 'text-[13px]' : 'text-[11px]'} tracking-wide ${s.text} uppercase leading-tight mt-1 line-clamp-2`}>
        {tech.name}
      </p>
    </button>
  );
}