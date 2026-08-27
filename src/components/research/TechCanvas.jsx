import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize, Crosshair } from 'lucide-react';
import TechNode from './TechNode';
import { TECH_TREE, isPrimaryTech } from '@/data/techTree';
import { getTechnologyState, getConnectionState } from '@/lib/techLayout';

const techById = Object.fromEntries(TECH_TREE.map((t) => [t.id, t]));
const nodeW = (id) => (techById[id] && isPrimaryTech(techById[id]) ? 200 : 168);
const nodeH = (id) => (techById[id] && isPrimaryTech(techById[id]) ? 92 : 74);

// Connection line colors/widths keyed off the derived edge state.
const LINE_COLORS = {
  completed: 'rgba(52,211,153,0.7)',
  active: 'rgba(251,191,36,0.7)',
  dormant: 'rgba(100,116,139,0.45)',
  inactive: 'rgba(71,85,105,0.3)',
};
const LINE_WIDTH = { completed: 2.5, active: 2.5, dormant: 1.8, inactive: 1.5 };

// Pannable / zoomable graph surface. SVG layer draws connection lines behind
// an absolutely-positioned HTML node layer. Pan starts only from the
// background (data-canvas-bg) so node clicks never trigger a drag. Wheel and
// pinch zoom toward the cursor/midpoint. Nodes outside the viewport are
// culled so hundreds of techs stay performant.
export default function TechCanvas({ statusMap, edges, layout, selectedId, onSelect, visibleIds }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 24, y: 16 });
  const [size, setSize] = useState({ w: 800, h: 600 });
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const panRef = useRef(pan); panRef.current = pan;

  const { pos, worldW, worldH } = layout;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomAt = (clientX, clientY, factor) => {
    const rect = containerRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const nz = Math.max(0.2, Math.min(2.5, zoomRef.current * factor));
    const wx = (px - panRef.current.x) / zoomRef.current;
    const wy = (py - panRef.current.y) / zoomRef.current;
    setZoom(nz);
    setPan({ x: px - wx * nz, y: py - wy * nz });
  };

  const zoomCenter = (factor) => {
    const rect = containerRef.current.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  };

  const onWheel = (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  const onPointerDown = (e) => {
    if (!e.target.dataset || !e.target.dataset.canvasBg) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        zoom: zoomRef.current,
        pan: { ...panRef.current },
        mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
      };
      drag.current = null;
    } else {
      drag.current = { startX: e.clientX, startY: e.clientY, pan: { ...panRef.current } };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const [p1, p2] = [...pointers.current.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (!pinch.current.dist) return;
      const factor = dist / pinch.current.dist;
      const rect = containerRef.current.getBoundingClientRect();
      const px = pinch.current.mid.x - rect.left;
      const py = pinch.current.mid.y - rect.top;
      const nz = Math.max(0.2, Math.min(2.5, pinch.current.zoom * factor));
      const wx = (px - pinch.current.pan.x) / pinch.current.zoom;
      const wy = (py - pinch.current.pan.y) / pinch.current.zoom;
      setZoom(nz);
      setPan({ x: px - wx * nz, y: py - wy * nz });
      return;
    }
    if (drag.current) {
      setPan({
        x: drag.current.pan.x + (e.clientX - drag.current.startX),
        y: drag.current.pan.y + (e.clientY - drag.current.startY),
      });
    }
  };

  const endDrag = (e) => {
    pointers.current.delete(e.pointerId);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  };

  const reset = () => { setZoom(0.85); setPan({ x: 24, y: 16 }); };
  const centerSelected = () => {
    if (!selectedId || !pos[selectedId]) return;
    const p = pos[selectedId];
    const rect = containerRef.current.getBoundingClientRect();
    setPan({
      x: rect.width / 2 - (p.x + p.w / 2) * zoom,
      y: rect.height / 2 - (p.y + p.h / 2) * zoom,
    });
  };

  // Viewport culling: only render nodes within the visible world rect (padded).
  const viewLeft = -pan.x / zoom;
  const viewTop = -pan.y / zoom;
  const viewW = size.w / zoom;
  const viewH = size.h / zoom;
  const pad = 100;

  const visibleTechs = useMemo(() => TECH_TREE.filter((t) => {
    const p = pos[t.id];
    if (!p) return false;
    if (visibleIds && !visibleIds.has(t.id)) return false;
    return (
      p.x + p.w + pad >= viewLeft &&
      p.x - pad <= viewLeft + viewW &&
      p.y + p.h + pad >= viewTop &&
      p.y - pad <= viewTop + viewH
    );
  }), [pos, visibleIds, viewLeft, viewTop, viewW, viewH]);

  return (
    <div className="relative w-full" style={{ height: 'min(72vh, 660px)' }}>
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden rounded-xl touch-none select-none cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div
          className="absolute origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: worldW, height: worldH }}
        >
          <div data-canvas-bg="1" className="absolute inset-0" />
          <svg className="absolute inset-0 pointer-events-none" width={worldW} height={worldH} style={{ overflow: 'visible' }}>
            {edges.map((ed, i) => {
              const from = pos[ed.from];
              const to = pos[ed.to];
              if (!from || !to) return null;
              const fs = getTechnologyState({ id: ed.from }, statusMap);
              const ts = getTechnologyState({ id: ed.to }, statusMap);
              const cs = getConnectionState(fs, ts);
              const x1 = from.x + nodeW(ed.from);
              const y1 = from.y + nodeH(ed.from) / 2;
              const x2 = to.x;
              const y2 = to.y + nodeH(ed.to) / 2;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={LINE_COLORS[cs]}
                  strokeWidth={LINE_WIDTH[cs]}
                />
              );
            })}
          </svg>
          {visibleTechs.map((t) => {
            const p = pos[t.id];
            const st = getTechnologyState(t, statusMap);
            return (
              <TechNode
                key={t.id}
                tech={t}
                state={st}
                position={p}
                selected={selectedId === t.id}
                onClick={() => onSelect(t.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Zoom / center / reset controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button onClick={() => zoomCenter(1.3)} className="w-9 h-9 rounded-lg glass-panel-strong flex items-center justify-center text-cyan-200 hover:text-white transition-colors" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => zoomCenter(1 / 1.3)} className="w-9 h-9 rounded-lg glass-panel-strong flex items-center justify-center text-cyan-200 hover:text-white transition-colors" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={centerSelected} disabled={!selectedId} className="w-9 h-9 rounded-lg glass-panel-strong flex items-center justify-center text-cyan-200 hover:text-white transition-colors disabled:opacity-40" title="Center on selected">
          <Crosshair className="w-4 h-4" />
        </button>
        <button onClick={reset} className="w-9 h-9 rounded-lg glass-panel-strong flex items-center justify-center text-cyan-200 hover:text-white transition-colors" title="Reset view">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 glass-panel rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-cyan-200/80">
        {zoom.toFixed(2)}× · {visibleTechs.length} nodes
      </div>
    </div>
  );
}