import React from "react";
import { CATEGORIES } from "@/data/techTree";
import { getTechIcon } from "./techIcons";
import { Check, Lock } from "lucide-react";

const STATUS_STYLES = {
  completed: { border: "border-emerald-400/60", glow: "shadow-[0_0_18px_rgba(52,211,153,0.35)]", opacity: "opacity-100" },
  available: { border: "border-cyan-400/70", glow: "shadow-[0_0_16px_rgba(34,211,238,0.28)]", opacity: "opacity-100" },
  locked: { border: "border-slate-600/40", glow: "", opacity: "opacity-60" },
  researching: { border: "border-cyan-300", glow: "shadow-[0_0_26px_rgba(34,211,238,0.55)]", opacity: "opacity-100" },
};

export default function TechNode({ tech, status, progress, dimmed, highlighted, hovered, onHover, onClick }) {
  const cat = CATEGORIES[tech.category];
  const Icon = getTechIcon(tech);
  const s = STATUS_STYLES[status] || STATUS_STYLES.locked;
  const turnsLeft = Math.max(0, tech.researchTurns - (progress || 0));
  const pct = Math.min(100, ((progress || 0) / tech.researchTurns) * 100);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => onHover(tech.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(tech)}
      className={[
        "w-full h-full glass-panel rounded-xl px-3 py-2.5 flex items-center gap-3 cursor-pointer",
        "border transition-all duration-200",
        s.border, s.glow, s.opacity,
        dimmed ? "!opacity-20 saturate-50" : "",
        highlighted || hovered ? "brightness-125 scale-[1.02]" : "",
        status === "researching" ? "animate-pulse-glow" : "",
      ].join(" ")}
    >
      <div className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 ${cat.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[12px] uppercase tracking-wide text-foreground leading-tight truncate">
          {tech.name}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5 flex items-center gap-1">
          <span className={cat.color}>●</span> {tech.category}
        </p>
        <div className="mt-1 min-h-[14px]">
          {status === "completed" && (
            <p className="text-[10px] font-heading uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Complete
            </p>
          )}
          {status === "available" && (
            <p className="text-[10px] font-heading uppercase tracking-wider text-cyan-300">
              {tech.researchTurns} turn{tech.researchTurns === 1 ? "" : "s"}
            </p>
          )}
          {status === "locked" && (
            <p className="text-[10px] font-heading uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </p>
          )}
          {status === "researching" && (
            <div>
              <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[9px] font-mono text-cyan-200 mt-0.5">{turnsLeft} turn{turnsLeft === 1 ? "" : "s"} left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}