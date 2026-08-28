import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { TECH_TREE, CATEGORIES, totalResearchSpeedBonus, computeCompletionMs } from '@/data/techTree';
import TechIcon from './techIcons';
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react';

const techById = Object.fromEntries(TECH_TREE.map((t) => [t.id, t]));

function formatRemaining(ms) {
  if (ms <= 0) return 'Complete';
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// Shows every in-progress research with a live progress bar and time
// remaining. Completion is recomputed from start_date + research_turns and
// the player's live speed bonus (completed Quantum Computing + purchased
// upgrade tiers), so the finish line shifts instantly when the bonus changes.
export default function ActiveResearchPanel() {
  const { empire } = useEmpire();
  const [data, setData] = useState(null); // null = loading
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const all = await base44.entities.TechProgress.filter({ created_by_id: user.id });
        if (!active) return;
        setData({
          researching: all.filter((r) => r.status === 'researching'),
          completed: all.filter((r) => r.status === 'completed').map((r) => r.tech_id),
        });
      } catch {
        if (active) setData({ researching: [], completed: [] });
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (data === null) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
      </div>
    );
  }

  const { researching, completed } = data;
  const bonus = totalResearchSpeedBonus(completed, empire?.research_speed_level || 0);

  if (!researching.length) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <FlaskConical className="w-5 h-5 text-cyan-300/60 mx-auto mb-2" />
        <p className="font-heading text-sm tracking-wide text-cyan-200/80 uppercase">No Active Research</p>
        <p className="text-xs text-muted-foreground mt-1">Visit the Research Nexus to begin a technology.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {researching.map((rec) => {
        const tech = techById[rec.tech_id];
        const cat = tech ? CATEGORIES[tech.category] : null;
        const iconName = (tech && (tech.icon || cat?.icon)) || 'Cpu';
        const startMs = rec.start_date
          ? new Date(rec.start_date).getTime()
          : (rec.created_date ? new Date(rec.created_date).getTime() : now);
        const completionMs = computeCompletionMs(startMs, rec.research_turns || 1, bonus);
        const span = Math.max(1, completionMs - startMs);
        const frac = Math.min(1, Math.max(0, (now - startMs) / span));
        const remaining = Math.max(0, completionMs - now);
        const done = remaining <= 0;
        return (
          <div key={rec.id} className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-cyan-400/20 bg-cyan-400/10">
                <TechIcon name={iconName} className={`w-4 h-4 ${cat?.color || 'text-slate-300'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400/80">
                  T{tech?.tier} · {tech?.category}
                </p>
                <h3 className="font-heading text-sm tracking-wide text-white uppercase leading-tight truncate">
                  {tech ? tech.name : rec.tech_id.replace(/_/g, ' ')}
                </h3>
              </div>
              {done ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </span>
              ) : (
                <span className="font-mono text-xs text-cyan-200 tabular-nums whitespace-nowrap">
                  {formatRemaining(remaining)}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${done ? 'bg-emerald-400' : 'bg-cyan-400'} transition-all`}
                  style={{ width: `${frac * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] font-mono text-muted-foreground">{Math.floor(frac * 100)}%</p>
                {bonus > 0 && (
                  <p className="text-[10px] font-mono text-amber-300/80 uppercase tracking-widest">
                    ⚡ {Math.round(bonus * 100)}% faster
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}