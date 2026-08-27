import React, { useState, useEffect } from 'react';
import { X, FlaskConical, Lock, CheckCircle2, Loader2, Coins, Clock, Link2 } from 'lucide-react';
import TechIcon from './techIcons';
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
  return (
    <div className={`flex items-center gap-2 text-xs ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {t ? t.name : id.replace(/_/g, ' ')}
    </div>
  );
}

export default function TechInfoPanel({ tech, statusMap, progress, speedBonus = 0, submitting, error, onBeginResearch, onClose }) {
  if (!tech) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-full min-h-[300px] flex flex-col items-center justify-center text-center">
        <FlaskConical className="w-8 h-8 text-cyan-300/60 mb-3" />
        <p className="font-heading text-sm tracking-[0.2em] text-cyan-200/70 uppercase">Select a Technology</p>
        <p className="text-xs text-muted-foreground font-body mt-2 max-w-[220px]">
          Click any node in the tree to inspect its research cost, prerequisites, and unlocks.
        </p>
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

  return (
    <div className="glass-panel rounded-2xl p-5 h-full overflow-y-auto">
      <div className="flex items-start gap-3">
        <div className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-cyan-400/20 bg-cyan-400/10">
          <TechIcon name={tech.icon || cat?.icon || 'Cpu'} className={`w-5 h-5 ${cat?.color || 'text-slate-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400/80">T{tech.tier} · {tech.category}</span>
            {primary && <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300/80">★ Primary</span>}
          </div>
          <h2 className="font-heading text-base tracking-wide text-white uppercase leading-tight">{tech.name}</h2>
        </div>
        <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className={`mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${sl.color}`}>
        <sl.Icon className={`w-3.5 h-3.5 ${state === 'researching' ? 'animate-spin' : ''}`} />
        {sl.text}
      </div>

      <p className="text-sm text-muted-foreground font-body mt-3">{tech.description}</p>

      {/* Research cost */}
      <div className="mt-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-200/70 mb-2 flex items-center gap-1">
          <Coins className="w-3 h-3" /> Research Cost
        </p>
        <div className="flex flex-wrap gap-2">
          {costEntries.map(([k, v]) => (
            <span key={k} className="text-xs font-mono px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-200">
              {RES_LABELS[k] || k}: <span className="text-cyan-200">{Math.floor(v).toLocaleString()}</span>
            </span>
          ))}
          <span className="text-xs font-mono px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> ~{formatDuration(tech.researchTurns * BASE_TURN_SECONDS * (1 - speedBonus))}
          </span>
        </div>
      </div>

      {/* Prerequisites */}
      {(all.length > 0 || any.length > 0) && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-200/70 mb-2 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Prerequisites
          </p>
          <div className="space-y-1.5">
            {all.length > 0 && <p className="text-[10px] uppercase tracking-widest text-slate-500">All of:</p>}
            {all.map((p) => <PrereqRow key={p} id={p} statusMap={statusMap} />)}
            {any.length > 0 && <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Any of:</p>}
            {any.map((p) => <PrereqRow key={p} id={p} statusMap={statusMap} />)}
          </div>
        </div>
      )}

      {/* Unlocks */}
      {Object.keys(unlocks).length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-200/70 mb-2">Unlocks</p>
          <div className="space-y-2">
            {Object.entries(unlocks).filter(([, arr]) => arr && arr.length).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{UNLOCK_LABELS[group] || group}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {items.map((it) => (
                    <span key={it} className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-200">
                      {it.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action / progress */}
      <div className="mt-5">
        {state === 'researching' && rec && (
          <ResearchProgress rec={rec} speedBonus={speedBonus} />
        )}
        {state === 'available' && (
          <button
            onClick={() => onBeginResearch(tech.id)}
            disabled={submitting}
            className="w-full rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-900 font-heading text-sm tracking-wide uppercase py-2.5 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Starting…' : 'Begin Research'}
          </button>
        )}
        {state === 'researched' && (
          <div className="w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 font-heading text-sm tracking-wide uppercase py-2.5 text-center">
            Research Complete
          </div>
        )}
        {state === 'locked' && (
          <div className="w-full rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-500 font-heading text-sm tracking-wide uppercase py-2.5 text-center">
            Prerequisites Unmet
          </div>
        )}
        {error && <p className="text-xs text-rose-300 mt-2">{error}</p>}
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  const s = Math.max(1, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatRemaining(ms) {
  if (ms <= 0) return 'Complete';
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

// Live, time-based progress + countdown for the active research. The
// completion line is recomputed from the record's start_date + research_turns
// and the player's live speed bonus, so it shifts instantly when the bonus
// changes (e.g. buying an upgrade on the Upgrades page).
function ResearchProgress({ rec, speedBonus }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const startMs = rec.start_date
    ? new Date(rec.start_date).getTime()
    : (rec.created_date ? new Date(rec.created_date).getTime() : now);
  const completionMs = computeCompletionMs(startMs, rec.research_turns || 1, speedBonus);
  const span = Math.max(1, completionMs - startMs);
  const frac = Math.min(1, Math.max(0, (now - startMs) / span));
  const remaining = Math.max(0, completionMs - now);
  return (
    <div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-cyan-400 transition-all" style={{ width: `${frac * 100}%` }} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-cyan-200/80 font-mono">{formatRemaining(remaining)} remaining</p>
        {speedBonus > 0 && (
          <p className="text-[10px] font-mono text-amber-300/80 uppercase tracking-widest">⚡ {Math.round(speedBonus * 100)}% faster</p>
        )}
      </div>
    </div>
  );
}