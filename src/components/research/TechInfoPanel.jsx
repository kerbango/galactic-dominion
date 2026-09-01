import React, { useState, useEffect } from 'react';
import { X, FlaskConical, Lock, CheckCircle2, Loader2, Coins, Clock, Link2, ChevronRight } from 'lucide-react';
import TechIcon from './techIcons';
import UnlockBadges from './UnlockBadges';
import { TECH_TREE, CATEGORIES, getResearchCost, getUnlocks, isPrimaryTech, normalizePrereqs, computeCompletionMs, BASE_TURN_SECONDS } from '@/data/techTree';
import { getTechnologyState } from '@/lib/techLayout';

const STATE_LABEL = {
  researched: { text: 'Researched', color: 'text-emerald-300', Icon: CheckCircle2 },
  available: { text: 'Available', color: 'text-amber-300', Icon: FlaskConical },
  locked: { text: 'Locked', color: 'text-slate-500', Icon: Lock },
  researching: { text: 'Researching', color: 'text-cyan-300', Icon: Loader2 },
};
const UNLOCK_LABELS = { units: 'Units', weapons: 'Weapons', upgrades: 'Upgrades', buildings: 'Buildings', abilities: 'Abilities' };
const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium', research_points: 'Research Pts' };

function PrereqRow({ id, statusMap }) {
  const t = TECH_TREE.find((x) => x.id === id);
  const st = getTechnologyState(t || { id }, statusMap);
  const color = st === 'researched' ? 'text-emerald-300' : st === 'available' ? 'text-amber-300' : 'text-slate-500';
  const dot = st === 'researched' ? 'bg-emerald-400' : st === 'available' ? 'bg-amber-400' : 'bg-slate-600';
  return <div className={`flex items-center gap-2 text-[11px] ${color}`}><span className={`w-1.5 h-1.5 rounded-full ${dot} shadow-[0_0_5px_currentColor]`} />{t ? t.name : id.replace(/_/g, ' ')}</div>;
}

export default function TechInfoPanel({ tech, statusMap, progress, speedBonus = 0, submitting, error, onBeginResearch, onClose }) {
  if (!tech) {
    return (
      <div className="rounded-xl border border-cyan-400/20 bg-[#06111d]/95 p-6 h-full min-h-[300px] flex flex-col items-center justify-center text-center">
        <FlaskConical className="w-9 h-9 text-cyan-300/40 mb-3" />
        <p className="font-heading text-sm tracking-[0.2em] text-cyan-200/70 uppercase">Select a Technology</p>
        <p className="text-xs text-slate-500 font-body mt-2 max-w-[220px]">Click any node in the network to inspect its cost, prerequisites, and unlocks.</p>
      </div>
    );
  }

  const state = getTechnologyState(tech, statusMap);
  const sl = STATE_LABEL[state];
  const cat = CATEGORIES[tech.category];
  const cost = getResearchCost(tech);
  const unlocks = getUnlocks(tech);
  const { all, any } = normalizePrereqs(tech);
  const rec = progress?.[tech.id];
  const primary = isPrimaryTech(tech);
  const costEntries = Object.entries(cost).filter(([, v]) => v > 0);
  const stateBorder = state === 'researched' ? 'border-emerald-400/40' : state === 'available' ? 'border-amber-400/50' : state === 'researching' ? 'border-cyan-400/50' : 'border-slate-700/60';

  return (
    <div className={`rounded-xl border ${stateBorder} bg-[#06111d]/96 shadow-[0_0_30px_rgba(8,145,178,0.08)] p-4 md:p-5 h-full overflow-y-auto`}>
      <div className="flex items-start gap-3 pb-4 border-b border-cyan-400/10">
        <div className={`shrink-0 w-11 h-11 rounded-lg border ${state === 'available' ? 'border-amber-400/40 bg-amber-400/10' : 'border-cyan-400/20 bg-cyan-400/10'} flex items-center justify-center`}>
          <TechIcon name={tech.icon || cat?.icon || 'Cpu'} className={`w-5 h-5 ${cat?.color || 'text-cyan-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-300/55">T{tech.tier} · {tech.category}</span>
            {primary && <span className="font-mono text-[8px] uppercase tracking-widest text-amber-300">★ PRIMARY</span>}
            <UnlockBadges tags={tech.unlockTags} size="lg" />
          </div>
          <h2 className="font-heading text-lg tracking-wide text-white uppercase leading-tight">{tech.name}</h2>
        </div>
        <button onClick={onClose} className="shrink-0 text-slate-600 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className={`mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] ${sl.color}`}>
        <sl.Icon className={`w-3.5 h-3.5 ${state === 'researching' ? 'animate-spin' : ''}`} /> {sl.text}
      </div>
      <p className="text-xs leading-relaxed text-slate-400 font-body mt-3">{tech.description}</p>

      <SectionTitle icon={<Coins className="w-3 h-3" />}>Research Cost</SectionTitle>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {costEntries.map(([k, v]) => <div key={k} className="flex items-center justify-between rounded-md bg-[#02070d]/80 border border-slate-800/80 px-2.5 py-1.5"><span className="text-[10px] font-mono text-slate-500 uppercase">{RES_LABELS[k] || k}</span><span className="text-[11px] font-mono text-cyan-200">{Math.floor(v).toLocaleString()}</span></div>)}
      </div>
      <div className="flex items-center justify-between mt-1.5 rounded-md bg-[#02070d]/80 border border-slate-800/80 px-2.5 py-1.5"><span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Estimated Time</span><span className="text-[11px] font-mono text-cyan-200">{formatDuration(tech.researchTurns * BASE_TURN_SECONDS * (1 - speedBonus))}</span></div>

      {(all.length > 0 || any.length > 0) && <>
        <SectionTitle icon={<Link2 className="w-3 h-3" />}>Requires</SectionTitle>
        <div className="space-y-1.5 mt-2">{all.map((p) => <PrereqRow key={p} id={p} statusMap={statusMap} />)}{any.length > 0 && <p className="text-[9px] uppercase tracking-widest text-slate-600 pt-1">Any one of</p>}{any.map((p) => <PrereqRow key={p} id={p} statusMap={statusMap} />)}</div>
      </>}

      {Object.keys(unlocks).length > 0 && <>
        <SectionTitle>Unlocks</SectionTitle>
        <div className="space-y-2 mt-2">{Object.entries(unlocks).filter(([, arr]) => arr && arr.length).map(([group, items]) => <div key={group}><p className="text-[9px] uppercase tracking-widest text-slate-600">{UNLOCK_LABELS[group] || group}</p><div className="space-y-1 mt-1">{items.map((it) => <div key={it} className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-200"><ChevronRight className="w-3 h-3 text-amber-300" />{it.replace(/_/g, ' ')}</div>)}</div></div>)}</div>
      </>}

      <div className="mt-5">
        {state === 'researching' && rec && <ResearchProgress rec={rec} speedBonus={speedBonus} />}
        {state === 'available' && <button onClick={() => onBeginResearch(tech.id)} disabled={submitting} className="w-full rounded-lg border border-amber-300/70 bg-amber-400/90 hover:bg-amber-300 text-slate-950 font-heading text-xs tracking-[0.16em] uppercase py-3 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(245,158,11,0.22)]">{submitting ? 'Starting…' : 'Begin Research  »'}</button>}
        {state === 'researched' && <div className="w-full rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 font-heading text-xs tracking-[0.16em] uppercase py-3 text-center">✓ Research Complete</div>}
        {state === 'locked' && <div className="w-full rounded-lg border border-slate-700/50 bg-slate-900/70 text-slate-600 font-heading text-xs tracking-[0.16em] uppercase py-3 text-center">Prerequisites Unmet</div>}
        {error && <p className="text-xs text-rose-300 mt-2">{error}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }) { return <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-300/60 mt-4 mb-0 flex items-center gap-1.5">{icon}{children}</p>; }
function formatDuration(seconds) { const s = Math.max(1, Math.round(seconds)); if (s < 60) return `${s}s`; const m = Math.floor(s / 60); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); return `${h}h ${m % 60}m`; }
function formatRemaining(ms) { if (ms <= 0) return 'Complete'; const s = Math.ceil(ms / 1000); if (s < 60) return `${s}s`; const m = Math.floor(s / 60); return `${m}m ${s % 60}s`; }
function ResearchProgress({ rec, speedBonus }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const startMs = rec.start_date ? new Date(rec.start_date).getTime() : (rec.created_date ? new Date(rec.created_date).getTime() : now);
  const completionMs = computeCompletionMs(startMs, rec.research_turns || 1, speedBonus);
  const span = Math.max(1, completionMs - startMs); const frac = Math.min(1, Math.max(0, (now - startMs) / span)); const remaining = Math.max(0, completionMs - now);
  return <div><div className="flex items-center justify-between mb-1.5"><p className="text-[9px] font-mono uppercase tracking-widest text-cyan-300">Research in progress</p><p className="text-[10px] font-mono text-cyan-200">{formatRemaining(remaining)}</p></div><div className="h-2 rounded-full bg-slate-900 border border-cyan-400/10 overflow-hidden"><div className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all" style={{ width: `${frac * 100}%` }} /></div>{speedBonus > 0 && <p className="text-[9px] font-mono text-amber-300/80 uppercase tracking-widest mt-1">⚡ {Math.round(speedBonus * 100)}% faster</p>}</div>;
}
