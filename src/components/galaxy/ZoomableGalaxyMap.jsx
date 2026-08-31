import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { GRID_SIZE } from '@/lib/galaxy';
import FleetMarkers from '@/components/fleet/FleetMarkers';

const MAX_ZOOM = 12;

const clampView = ({ x, y, w, h }) => {
  const cw = Math.max(GRID_SIZE / MAX_ZOOM, Math.min(GRID_SIZE, w));
  const ch = cw;
  const cx = Math.max(0, Math.min(GRID_SIZE - cw, x));
  const cy = Math.max(0, Math.min(GRID_SIZE - ch, y));
  return { x: cx, y: cy, w: cw, h: ch };
};

// Zoomable, pannable SVG galactic map. Wheel zooms toward the cursor; drag
// pans; buttons zoom about the centre. Empire markers stay clickable and
// keep their original sizes regardless of zoom level.
export default function ZoomableGalaxyMap({ empires, myEmpire, fleets, now, myUserId, selectedId, onSelectId }) {
  const svgRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, w: GRID_SIZE, h: GRID_SIZE });
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  const zoomAt = (clientX, clientY, factor) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    setView((prev) => {
      const cursorX = prev.x + px * prev.w;
      const cursorY = prev.y + py * prev.h;
      const w = prev.w / factor;
      const h = prev.h / factor;
      return clampView({ x: cursorX - px * w, y: cursorY - py * h, w, h });
    });
  };

  const zoomCenter = (factor) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.25 : 1 / 1.25;
    zoomAt(e.clientX, e.clientY, factor);
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      // Begin pinch-to-zoom from the current view.
      const [p1, p2] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        view: { ...viewRef.current },
      };
      drag.current = null;
    } else if (pointers.current.size === 1) {
      drag.current = { startX: e.clientX, startY: e.clientY, view: { ...viewRef.current } };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;

    // Two-finger pinch zooms toward the midpoint, relative to gesture start.
    if (pointers.current.size >= 2 && pinch.current) {
      const [p1, p2] = [...pointers.current.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (!pinch.current.dist) return;
      const factor = dist / pinch.current.dist;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const px = (midX - rect.left) / rect.width;
      const py = (midY - rect.top) / rect.height;
      const cursorX = pinch.current.view.x + px * pinch.current.view.w;
      const cursorY = pinch.current.view.y + py * pinch.current.view.h;
      const w = pinch.current.view.w / factor;
      const h = pinch.current.view.h / factor;
      setView(clampView({ x: cursorX - px * w, y: cursorY - py * h, w, h }));
      return;
    }

    // Single-pointer drag pans the view.
    if (drag.current) {
      const dx = (e.clientX - drag.current.startX) * drag.current.view.w / rect.width;
      const dy = (e.clientY - drag.current.startY) * drag.current.view.h / rect.height;
      setView(clampView({ x: drag.current.view.x - dx, y: drag.current.view.y - dy, w: drag.current.view.w, h: drag.current.view.h }));
    }
  };

  const endDrag = (e) => {
    pointers.current.delete(e.pointerId);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
    } else if (pointers.current.size === 1) {
      // One finger remains after a pinch — resume panning from here.
      const [p] = [...pointers.current.values()];
      drag.current = { startX: p.x, startY: p.y, view: { ...viewRef.current } };
    }
  };

  const reset = () => setView({ x: 0, y: 0, w: GRID_SIZE, h: GRID_SIZE });
  const zoom = GRID_SIZE / view.w;

  return (
    <div className="glass-panel-strong rounded-2xl p-2 md:p-3">
      <div className="flex items-center justify-between gap-3 px-2 py-2 mb-2 border-b border-cyan-400/10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <p className="command-label">Deep Space Tactical Display</p>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/45">N-S · E-W Grid</span>
      </div>
      <div className="relative w-full overflow-hidden rounded-xl border border-cyan-400/15 bg-slate-950/35" style={{ aspectRatio: '1 / 1' }}><div className="scanline-overlay" />
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="w-full h-full touch-none select-none cursor-grab active:cursor-grabbing"
          preserveAspectRatio="xMidYMid meet"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {/* Tactical grid */}
          <defs>
            <radialGradient id="spaceGlow" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="rgba(14,116,144,0.10)" />
              <stop offset="100%" stopColor="rgba(2,6,23,0)" />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={GRID_SIZE} height={GRID_SIZE} fill="url(#spaceGlow)" />
          {Array.from({ length: GRID_SIZE / 100 + 1 }, (_, i) => i * 100).map((c) => (
            <g key={`g-${c}`}>
              <line x1={c} y1={0} x2={c} y2={GRID_SIZE} stroke="rgba(120,200,230,0.075)" strokeWidth={1} />
              <line x1={0} y1={c} x2={GRID_SIZE} y2={c} stroke="rgba(120,200,230,0.075)" strokeWidth={1} />
            </g>
          ))}
          {Array.from({ length: GRID_SIZE / 500 + 1 }, (_, i) => i * 500).map((c) => (
            <g key={`m-${c}`}>
              <line x1={c} y1={0} x2={c} y2={GRID_SIZE} stroke="rgba(56,189,248,0.12)" strokeWidth={1.5} />
              <line x1={0} y1={c} x2={GRID_SIZE} y2={c} stroke="rgba(56,189,248,0.12)" strokeWidth={1.5} />
            </g>
          ))}
          <rect x={0} y={0} width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke="rgba(103,232,249,0.28)" strokeWidth={2} rx={8} />

          {/* In-transit fleets (rendered under empire markers) */}
          <FleetMarkers fleets={fleets} now={now} myUserId={myUserId} myEmpireId={myEmpire?.id} />

          {/* Empire markers */}
          {empires.map((e) => {
            const mine = myEmpire && e.id === myEmpire.id;
            const sel = selectedId && e.id === selectedId;
            return (
              <g key={e.id} onClick={() => onSelectId(e.id)} className="cursor-pointer">
                {sel && (
                  <circle cx={e.map_x} cy={e.map_y} r={34} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} strokeDasharray="6 5" className="animate-spin-slow" />
                )}
                {mine && (
                  <circle cx={e.map_x} cy={e.map_y} r={30} fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth={2} className="animate-pulse-glow" />
                )}
                <circle cx={e.map_x} cy={e.map_y} r={mine ? 10 : 7} fill={mine ? 'rgba(56,189,248,0.95)' : 'rgba(167,139,250,0.9)'} stroke={sel ? '#ffffff' : 'rgba(255,255,255,0.45)'} strokeWidth={sel ? 3 : 1.5} />
                <circle cx={e.map_x} cy={e.map_y} r={mine ? 3 : 2} fill="rgba(224,247,255,0.95)" />
                <text
                  x={e.map_x}
                  y={e.map_y - 14}
                  textAnchor="middle"
                  fontSize={mine ? 20 : 15}
                  fontFamily="Orbitron, sans-serif"
                  fill={mine ? 'rgba(186,240,255,0.95)' : 'rgba(203,213,225,0.75)'}
                  style={{ pointerEvents: 'none' }}
                >
                  {e.empire_name.length > 16 ? e.empire_name.slice(0, 15) + '…' : e.empire_name}
                </text>
              </g>
            );
          })}

          {/* Own coordinates readout */}
          {myEmpire && (
            <text x={12} y={GRID_SIZE - 12} fontSize={16} fontFamily="ui-monospace, monospace" fill="rgba(120,200,230,0.7)">
              YOU @ {Math.round(myEmpire.map_x)}, {Math.round(myEmpire.map_y)}
            </text>
          )}
        </svg>

        {/* Zoom controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <div className="glass-panel-strong rounded-lg px-2 py-1.5 text-center">
            <p className="text-[8px] font-mono uppercase tracking-widest text-cyan-200/50">Scale</p>
            <p className="font-mono text-[10px] text-cyan-200">{zoom.toFixed(1)}×</p>
          </div>
          <button onClick={() => zoomCenter(1.6)} className="command-btn w-10 h-10 rounded-lg flex items-center justify-center" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => zoomCenter(1 / 1.6)} className="command-btn w-10 h-10 rounded-lg flex items-center justify-center" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={reset} className="command-btn w-10 h-10 rounded-lg flex items-center justify-center" title="Reset tactical view">
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-3 left-3 glass-panel rounded-md px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-widest text-cyan-200/75">
          GRID {Math.round(view.x)}:{Math.round(view.y)} · {Math.round(view.w)} UNITS
        </div>
        <div className="absolute bottom-3 right-3 glass-panel rounded-md px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-widest text-cyan-200/55">
          DRAG TO PAN · WHEEL TO ZOOM
        </div>
      </div>
    </div>
  );
}