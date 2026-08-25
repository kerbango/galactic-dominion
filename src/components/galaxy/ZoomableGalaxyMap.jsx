import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { GRID_SIZE } from '@/lib/galaxy';
import FleetMarkers from '@/components/fleet/FleetMarkers';

// Visual scale: the grid grew from 1000 to 3000 units, so marker/text sizes
// are multiplied by S to keep the full-map appearance the same as before.
// Zooming in then reveals proportionally larger detail.
const S = GRID_SIZE / 1000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 12;

const clampView = ({ x, y, w, h }) => {
  const cw = Math.max(GRID_SIZE / MAX_ZOOM, Math.min(GRID_SIZE, w));
  const ch = cw;
  const cx = Math.max(0, Math.min(GRID_SIZE - cw, x));
  const cy = Math.max(0, Math.min(GRID_SIZE - ch, y));
  return { x: cx, y: cy, w: cw, h: ch };
};

// Zoomable, pannable SVG galactic map. Wheel zooms toward the cursor; drag
// pans; buttons zoom about the centre. Empire markers stay clickable.
export default function ZoomableGalaxyMap({ empires, myEmpire, fleets, now, myUserId, selectedId, onSelectId }) {
  const svgRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, w: GRID_SIZE, h: GRID_SIZE });
  const drag = useRef(null);

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
    drag.current = { startX: e.clientX, startY: e.clientY, view: { ...view } };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const dx = (e.clientX - drag.current.startX) * drag.current.view.w / rect.width;
    const dy = (e.clientY - drag.current.startY) * drag.current.view.h / rect.height;
    setView(clampView({ x: drag.current.view.x - dx, y: drag.current.view.y - dy, w: drag.current.view.w, h: drag.current.view.h }));
  };

  const endDrag = (e) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const reset = () => setView({ x: 0, y: 0, w: GRID_SIZE, h: GRID_SIZE });

  const gridStep = GRID_SIZE / 10;
  const zoom = GRID_SIZE / view.w;

  return (
    <div className="glass-panel-strong rounded-2xl p-3 md:p-4">
      <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
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
          {/* Grid lines */}
          {Array.from({ length: GRID_SIZE / gridStep + 1 }, (_, i) => i * gridStep).map((c) => (
            <g key={`g-${c}`}>
              <line x1={c} y1={0} x2={c} y2={GRID_SIZE} stroke="rgba(120,200,230,0.08)" strokeWidth={S} />
              <line x1={0} y1={c} x2={GRID_SIZE} y2={c} stroke="rgba(120,200,230,0.08)" strokeWidth={S} />
            </g>
          ))}
          {/* Frame */}
          <rect x={0} y={0} width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke="rgba(120,200,230,0.25)" strokeWidth={2 * S} rx={8 * S} />

          {/* In-transit fleets (rendered under empire markers) */}
          <FleetMarkers fleets={fleets} now={now} myUserId={myUserId} scale={S} />

          {/* Empire markers */}
          {empires.map((e) => {
            const mine = myEmpire && e.id === myEmpire.id;
            const sel = selectedId && e.id === selectedId;
            return (
              <g key={e.id} onClick={() => onSelectId(e.id)} className="cursor-pointer">
                {mine && (
                  <circle cx={e.map_x} cy={e.map_y} r={26 * S} fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth={2 * S} className="animate-pulse-glow" />
                )}
                <circle
                  cx={e.map_x}
                  cy={e.map_y}
                  r={mine ? 9 * S : 6 * S}
                  fill={mine ? 'rgba(56,189,248,0.95)' : 'rgba(167,139,250,0.85)'}
                  stroke={sel ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={sel ? 3 * S : 1.5 * S}
                />
                <text
                  x={e.map_x}
                  y={e.map_y - 14 * S}
                  textAnchor="middle"
                  fontSize={mine ? 20 * S : 15 * S}
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
            <text x={12 * S} y={GRID_SIZE - 12 * S} fontSize={16 * S} fontFamily="ui-monospace, monospace" fill="rgba(120,200,230,0.7)">
              YOU @ {Math.round(myEmpire.map_x)}, {Math.round(myEmpire.map_y)}
            </text>
          )}
        </svg>

        {/* Zoom controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button onClick={() => zoomCenter(1.6)} className="w-9 h-9 rounded-lg glass-panel-strong flex items-center justify-center text-cyan-200 hover:text-white transition-colors" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => zoomCenter(1 / 1.6)} className="w-9 h-9 rounded-lg glass-panel-strong flex items-center justify-center text-cyan-200 hover:text-white transition-colors" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={reset} className="w-9 h-9 rounded-lg glass-panel-strong flex items-center justify-center text-cyan-200 hover:text-white transition-colors" title="Reset view">
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-3 left-3 glass-panel rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-cyan-200/80">
          {zoom.toFixed(1)}× · {Math.round(view.w)} units
        </div>
      </div>
    </div>
  );
}