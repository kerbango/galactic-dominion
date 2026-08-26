import React from "react";
import { TECH_TREE } from "@/data/techTree";
import { computeLayout } from "@/lib/techLayout";

const COLORS = {
  done: "#34d399",
  active: "#22d3ee",
  open: "#22d3ee",
  locked: "#3b4a63",
};

function lineStatus(prereqStatus, techStatus) {
  if (prereqStatus === "completed" && techStatus === "completed") return "done";
  if (prereqStatus === "completed" && techStatus === "researching") return "active";
  if (prereqStatus === "completed") return "open";
  return "locked";
}

export default function ConnectionLines({ statuses, hoveredId, hoverSet }) {
  const { pos, worldW, worldH } = computeLayout();
  const lines = [];
  for (const tech of TECH_TREE) {
    for (const pid of tech.prerequisites || []) {
      const a = pos[pid];
      const b = pos[tech.id];
      if (!a || !b) continue;
      const sx = a.x + a.w;
      const sy = a.y + a.h / 2;
      const ex = b.x;
      const ey = b.y + b.h / 2;
      const mx = (sx + ex) / 2;
      const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
      const ls = lineStatus(statuses[pid], statuses[tech.id]);
      const dim = hoveredId && !hoverSet.has(pid) && !hoverSet.has(tech.id);
      lines.push({ d, ls, dim, key: pid + "->" + tech.id });
    }
  }
  return (
    <svg width={worldW} height={worldH} className="absolute top-0 left-0 pointer-events-none" style={{ overflow: "visible" }}>
      <defs>
        <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {lines.map((l) => (
        <path
          key={l.key}
          d={l.d}
          fill="none"
          stroke={COLORS[l.ls]}
          strokeWidth={l.ls === "done" ? 2.4 : l.ls === "locked" ? 1.1 : 1.8}
          strokeOpacity={l.dim ? 0.1 : l.ls === "open" ? 0.5 : l.ls === "locked" ? 0.45 : 0.95}
          filter={l.ls === "done" || l.ls === "active" ? "url(#line-glow)" : undefined}
          strokeDasharray={l.ls === "active" ? "7 6" : undefined}
          className={l.ls === "active" ? "animate-pulse-glow" : ""}
          style={{ transition: "stroke-opacity 0.2s" }}
        />
      ))}
    </svg>
  );
}