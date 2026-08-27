import React from 'react';
import TechIcon from './techIcons';
import { CATEGORIES, isPrimaryTech } from '@/data/techTree';

// Visual state is driven entirely by the derived state string — no per-tech
// logic. Tailwind classes are literal strings so the purge step keeps them.
const STATE_STYLES = {
  researched: {
    border: 'border-emerald-400/80',
    glow: 'shadow-[0_0_18px_rgba(52,211,153,0.45)]',
    bg: 'bg-emerald-400/5',
    icon: '',
    text: 'text-emerald-50',
    label: 'Researched',
    labelColor: 'text-emerald-300',
    ring: 'ring-emerald-400/60',
  },
  available: {
    border: 'border-amber-400/80',
    glow: 'shadow-[0_0_18px_rgba(251,191,36,0.45)]',
    bg: 'bg-amber-400/5',
    icon: '',
    text: 'text-amber-50',
    label: 'Available',
    labelColor: 'text-amber-300',
    ring: 'ring-amber-400/60',
  },
  locked: {
    border: 'border-slate-600/60',
    glow: '',
    bg: 'bg-slate-950/50',
    icon: 'grayscale brightness-75 opacity-60',
    text: 'text-slate-400',
    label: 'Locked',
    labelColor: 'text-slate-500',
    ring: 'ring-slate-600/40',
  },
  researching: {
    border: 'border-cyan-400/80',
    glow: 'shadow-[0_0_22px_rgba(56,189,248,0.6)]',
    bg: 'bg-cyan-400/5',
    icon: '',
    text: 'text-cyan-50',
    label: 'Researching',
    labelColor: 'text-cyan-300',
    ring: 'ring-cyan-400/60',
  },
};

export default function TechNode({ tech, state, position, selected, onClick }) {
  const s = STATE_STYLES[state] || STATE_STYLES.locked;
  const primary = isPrimaryTech(tech);
  const cat = CATEGORIES[tech.category];
  const iconName = tech.icon || cat?.icon || 'Cpu';
  const w = primary ? 200 : 168;
  const h = primary ? 92 : 74;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: position.x, top: position.y, width: w, height: h }}
      className={`absolute text-left rounded-xl border ${s.border} ${s.glow} ${s.bg} backdrop-blur-md px-2.5 py-1.5 transition-transform hover:z-20 hover:scale-[1.03] ${selected ? `z-20 ring-2 ${s.ring}` : ''}`}
    >
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