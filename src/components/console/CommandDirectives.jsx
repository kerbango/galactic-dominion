import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, X, ChevronRight, ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { toastSuccess } from '@/lib/toasts';

// Onboarding checklist that guides new commanders through core gameplay.
// Completion is derived from existing game state (built ships, research
// projects, deployed fleets) — no separate progress entity. The player's
// dismissal preference and the final "completed" state are persisted in
// localStorage so the panel doesn't reappear after being dismissed or
// finished. Directives are optional guidance, never mandatory.
const STORAGE_DISMISSED = 'krin_directives_dismissed';
const STORAGE_COMPLETED = 'krin_directives_completed';

const DIRECTIVES = [
  { id: 'build_ship', label: 'Construct your first warship', done: ({ units }) => units.some((u) => u.owned_count > 0) },
  { id: 'research', label: 'Begin a research project', done: ({ techs }) => techs.length > 0 },
  { id: 'dispatch', label: 'Deploy a fleet to a rival system', done: ({ fleets }) => fleets.some((f) => f.mission_type === 'attack') },
  { id: 'scout', label: 'Send a scout to recon an enemy', done: ({ fleets }) => fleets.some((f) => f.mission_type === 'scout') },
];

export default function CommandDirectives() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [techs, setTechs] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_DISMISSED) === '1');
  const [completed, setCompleted] = useState(() => localStorage.getItem(STORAGE_COMPLETED) === '1');

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const [u, t, f] = await Promise.all([
          base44.entities.Unit.filter({ created_by_id: user.id }),
          base44.entities.TechProgress.filter({ created_by_id: user.id }),
          base44.entities.Fleet.filter({ created_by_id: user.id }),
        ]);
        if (!active) return;
        setUnits(u); setTechs(t); setFleets(f);
      } catch { /* ignore — panel just shows incomplete */ }
    };
    load();
    const unsubU = base44.entities.Unit.subscribe(() => load());
    const unsubT = base44.entities.TechProgress.subscribe(() => load());
    const unsubF = base44.entities.Fleet.subscribe(() => load());
    return () => { active = false; unsubU?.(); unsubT?.(); unsubF?.(); };
  }, [user]);

  const ctx = { units, techs, fleets };
  const items = DIRECTIVES.map((d) => ({ ...d, complete: d.done(ctx) }));
  const allComplete = items.length > 0 && items.every((i) => i.complete);
  const doneCount = items.filter((i) => i.complete).length;

  // Auto-complete: once every directive is satisfied, persist the completed
  // state, fire a one-time success toast, and hide the panel for good.
  useEffect(() => {
    if (allComplete && !completed) {
      localStorage.setItem(STORAGE_COMPLETED, '1');
      setCompleted(true);
      toastSuccess('COMMAND DIRECTIVES COMPLETE', 'All operational objectives fulfilled.');
    }
  }, [allComplete, completed]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_DISMISSED, '1');
    setDismissed(true);
  };
  const reopen = () => {
    localStorage.removeItem(STORAGE_DISMISSED);
    setDismissed(false);
  };

  if (completed) return null;

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={reopen}
        className="mb-4 w-full glass-panel rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-cyan-200 hover:text-cyan-100 hover:border-cyan-400/40 transition-colors"
      >
        <span className="flex items-center gap-2 font-heading text-[11px] uppercase tracking-widest">
          <ClipboardList className="w-3.5 h-3.5" />
          Command Directives
          <span className="font-mono normal-case text-muted-foreground">({doneCount}/{items.length})</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4 mb-4 relative overflow-hidden border border-cyan-400/15">
      <div className="scanline-overlay" />
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-cyan-300" />
          <div>
            <p className="command-label">Command Directives</p>
            <h2 className="font-heading text-sm tracking-wide text-cyan-100 uppercase">Operational Objectives</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="command-btn rounded-md px-2.5 py-1 text-[10px] font-heading uppercase tracking-widest inline-flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Dismiss
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 text-xs">
            {it.complete
              ? <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              : <Circle className="w-4 h-4 text-slate-500 shrink-0" />}
            <span className={it.complete ? 'text-emerald-200/90 line-through' : 'text-foreground'}>{it.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {doneCount}/{items.length} complete · optional guidance
      </p>
    </div>
  );
}