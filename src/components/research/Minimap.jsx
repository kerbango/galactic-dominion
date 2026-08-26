import React, { useRef } from "react";
import { TECH_TREE } from "@/data/techTree";
import { computeLayout } from "@/lib/techLayout";

const W = 190;

export default function Minimap({ statuses, view, containerW, containerH, onPanTo }) {
  const { pos, worldW, worldH } = computeLayout();
  const scale = W / worldW;
  const H = worldH * scale;
  const ref = useRef(null);

  const handle = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    onPanTo(mx / scale, my / scale);
  };

  return (
    <div className="absolute bottom-5 left-5 z-30 glass-panel-strong rounded-lg p-1.5 border border-white/10 hidden sm:block">
      <div ref={ref} onClick={handle} className="relative cursor-pointer" style={{ width: W, height: H }}>
        <svg width={W} height={H} className="absolute inset-0">
          {TECH_TREE.map((t) => {
            const p = pos[t.id];
            const st = statuses[t.id];
            const c = st === "completed" ? "#34d399" : st === "researching" ? "#22d3ee" : st === "available" ? "#22d3ee" : "#475569";
            return (
              <rect
                key={t.id}
                x={p.x * scale}
                y={p.y * scale}
                width={Math.max(1.5, p.w * scale)}
                height={Math.max(1.5, p.h * scale)}
                rx={1.5}
                fill={c}
                opacity={st === "locked" ? 0.35 : 0.9}
              />
            );
          })}
        </svg>
        <div
          className="absolute border border-cyan-300/80 bg-cyan-300/10 pointer-events-none"
          style={{
            left: (-view.x / view.zoom) * scale,
            top: (-view.y / view.zoom) * scale,
            width: (containerW / view.zoom) * scale,
            height: (containerH / view.zoom) * scale,
          }}
        />
      </div>
    </div>
  );
}