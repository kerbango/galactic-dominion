import React from "react";
import { CATEGORIES } from "@/data/techTree";
import { TECH_TREE } from "@/data/techTree";
import { getTechIcon } from "./techIcons";
import { Check, Lock, ChevronRight, X, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TechInfoPanel({ tech, statuses, progress, researchingId, busy, error, onClose, onResearch }) {
  if (!tech) return null;
  const cat = CATEGORIES[tech.category];
  const Icon = getTechIcon(tech);
  const status = statuses[tech.id];

  const prereqs = (tech.prerequisites || []).map((id) => ({
    id,
    tech: TECH_TREE.find((t) => t.id === id),
    met: statuses[id] === "completed",
  }));
  const unlocks = TECH_TREE.filter((t) => (t.prerequisites || []).includes(tech.id));

  const canResearch = status === "available" && !researchingId && !busy;
  const turnsLeft = Math.max(0, tech.researchTurns - (progress || 0));

  return (
    <div className="absolute top-0 right-0 z-40 h-full w-[88vw] max-w-sm glass-panel-strong border-l border-cyan-400/20 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">Research Dossier</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X className="w-5 h-5" /></button>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 ${cat.color}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-xl uppercase tracking-wide text-white neon-text leading-tight">{tech.name}</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              <span className={cat.color}>●</span> {tech.category} · Tier {tech.tier}
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed mb-5">{tech.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="glass-panel rounded-lg p-3">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Research Time</p>
            <p className="font-heading text-lg text-cyan-200 mt-1">{tech.researchTurns} turn{tech.researchTurns === 1 ? "" : "s"}</p>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Status</p>
            <p className="font-heading text-sm mt-1">
              {status === "completed" && <span className="text-emerald-300">Complete</span>}
              {status === "available" && <span className="text-cyan-300">Available</span>}
              {status === "locked" && <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
              {status === "researching" && <span className="text-cyan-300">{turnsLeft} left</span>}
            </p>
          </div>
        </div>

        {status === "researching" && (
          <div className="mb-5">
            <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${Math.min(100, ((progress || 0) / tech.researchTurns) * 100)}%` }} />
            </div>
          </div>
        )}

        <Section title="Prerequisites">
          {prereqs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No prerequisites — root technology.</p>
          ) : (
            <ul className="space-y-1.5">
              {prereqs.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  {p.met ? <Check className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
                  <span className={p.met ? "text-foreground" : "text-muted-foreground"}>{p.tech?.name || p.id}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Unlocks">
          {unlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Terminal technology.</p>
          ) : (
            <ul className="space-y-1.5">
              {unlocks.map((u) => (
                <li key={u.id} className="flex items-center gap-2 text-sm text-foreground/90">
                  <ChevronRight className="w-4 h-4 text-cyan-400" /> {u.name}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="p-5 border-t border-white/10">
        {error && <p className="text-xs text-rose-300 mb-2 text-center">{error}</p>}
        {status === "completed" ? (
          <div className="w-full py-2.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-heading uppercase tracking-widest text-sm text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Researched
          </div>
        ) : status === "researching" ? (
          <div className="w-full py-2.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-heading uppercase tracking-widest text-sm text-center flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> In Progress
          </div>
        ) : researchingId ? (
          <p className="text-xs text-center text-amber-200/80">Another technology is already being researched.</p>
        ) : (
          <Button onClick={onResearch} disabled={!canResearch} className="w-full font-heading tracking-widest uppercase">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Research"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-200/70 mb-2">{title}</p>
      {children}
    </div>
  );
}