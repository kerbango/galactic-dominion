import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize, Crosshair, Move } from 'lucide-react';
import TechNode from './TechNode';
import { TECH_TREE } from '@/data/techTree';
import { getTechnologyState, getConnectionState } from '@/lib/techLayout';

const LINE_COLORS = {
  completed: 'rgba(34,197,94,0.88)',
  active: 'rgba(34,211,238,0.9)',
  dormant: 'rgba(96,165,250,0.38)',
  inactive: 'rgba(71,85,105,0.22)',
};
const LINE_WIDTH = { completed: 2.4, active: 2.4, dormant: 1.5, inactive: 1.1 };
const ARROW_FOR = { completed: 'url(#cwArrowGreen)', active: 'url(#cwArrowCyan)', dormant: 'url(#cwArrowGrey)', inactive: '' };

// Pannable / zoomable graph surface. Research behavior and edge logic are
// unchanged; only the command-console presentation is being refined here.
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
      pinch.current = { dist: Math.hypot(p1.x - p2.x, p1.y - p2.y), zoom: zoomRef.current, pan: { ...panRef.current }, mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } };
      drag.current = null;
    } else drag.current = { startX: e.clientX, startY: e.clientY, pan: { ...panRef.current } };
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
    if (drag.current) setPan({ x: drag.current.pan.x + (e.clientX - drag.current.startX), y: drag.current.pan.y + (e.clientY - drag.current.startY) });
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
    setPan({ x: rect.width / 2 - (p.x + p.w / 2) * zoom, y: rect.height / 2 - (p.y + p.h / 2) * zoom });
  };

  const viewLeft = -pan.x / zoom;
  const viewTop = -pan.y / zoom;
  const viewW = size.w / zoom;
  const viewH = size.h / zoom;
  const pad = 100;
  const visibleTechs = useMemo(() => TECH_TREE.filter((t) => {
    const p = pos[t.id];
    if (!p || (visibleIds && !visibleIds.has(t.id))) return false;
    return p.x + p.w + pad >= viewLeft && p.x - pad <= viewLeft + viewW && p.y + p.h + pad >= viewTop && p.y - pad <= viewTop + viewH;
  }), [pos, visibleIds, viewLeft, viewTop, viewW, viewH]);

  return (
    <div className="relative w-full" style={{ height: 'min(78vh, 760px)' }}>
      <div ref={containerRef} className="relative w-full h-full overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing" onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,rgba(8,47,73,0.3),transparent_55%)]" />
        <div className="absolute origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: worldW, height: worldH }}>
          <div data-canvas-bg="1" className="absolute inset-0" style={{
            backgroundColor: '#02070d',
            backgroundImage: 'linear-gradient(rgba(56,189,248,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.045) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(14,116,144,0.08), transparent 60%)',
            backgroundSize: '32px 32px, 32px 32px, 100% 100%',
          }} />
          <div data-canvas-bg="1" className="absolute inset-x-0 top-0 h-10 border-b border-cyan-400/10 bg-gradient-to-b from-cyan-400/[0.03] to-transparent" />
          <svg className="absolute inset-0 pointer-events-none" width={worldW} height={worldH} style={{ overflow: 'visible' }}>
            <defs>
              <filter id="cwGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <marker id="cwArrowGreen" markerWidth="7" markerHeight="7" refX="6.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3.5 L0,7 Z" fill="rgba(34,197,94,0.95)" /></marker>
              <marker id="cwArrowCyan" markerWidth="7" markerHeight="7" refX="6.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3.5 L0,7 Z" fill="rgba(34,211,238,0.95)" /></marker>
              <marker id="cwArrowGrey" markerWidth="7" markerHeight="7" refX="6.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3.5 L0,7 Z" fill="rgba(148,163,184,0.6)" /></marker>
            </defs>
            {edges.map((ed, i) => {
              const from = pos[ed.from]; const to = pos[ed.to];
              if (!from || !to) return null;
              const fs = getTechnologyState({ id: ed.from }, statusMap); const ts = getTechnologyState({ id: ed.to }, statusMap); const cs = getConnectionState(fs, ts);
              const x1 = from.x + from.w; const y1 = from.y + from.h / 2; const x2 = to.x; const y2 = to.y + to.h / 2; const midX = x1 + (x2 - x1) / 2;
              const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
              const flow = cs === 'completed' || cs === 'active';
              const isSel = selectedId && (ed.from === selectedId || ed.to === selectedId);
              const stroke = isSel ? 'rgba(103,232,249,0.98)' : LINE_COLORS[cs];
              const width = isSel ? 3 : LINE_WIDTH[cs];
              return <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" markerEnd={ARROW_FOR[cs] || undefined} strokeDasharray={flow ? '5 11' : undefined} filter={isSel ? 'url(#cwGlow)' : undefined}>{flow && <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.9s" repeatCount="indefinite" />}</path>;
            })}
          </svg>
          {visibleTechs.map((t) => <TechNode key={t.id} tech={t} state={getTechnologyState(t, statusMap)} position={pos[t.id]} selected={selectedId === t.id} onClick={() => onSelect(t.id)} />)}
        </div>
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <button onClick={() => zoomCenter(1.3)} className="w-9 h-9 rounded-md border border-cyan-400/20 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 hover:text-white hover:border-cyan-300/50 transition-colors" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <button onClick={() => zoomCenter(1 / 1.3)} className="w-9 h-9 rounded-md border border-cyan-400/20 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 hover:text-white hover:border-cyan-300/50 transition-colors" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        <button onClick={centerSelected} disabled={!selectedId} className="w-9 h-9 rounded-md border border-cyan-400/20 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 hover:text-white disabled:opacity-30 transition-colors" title="Center on selected"><Crosshair className="w-4 h-4" /></button>
        <button onClick={reset} className="w-9 h-9 rounded-md border border-cyan-400/20 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 hover:text-white transition-colors" title="Reset view"><Maximize className="w-4 h-4" /></button>
      </div>

      <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-md border border-cyan-400/15 bg-[#06111d]/90 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-400">
        <Move className="w-3 h-3 text-cyan-400/70" /> Drag to navigate · Scroll to zoom · {zoom.toFixed(2)}×
      </div>
      <div className="absolute right-3 bottom-3 rounded-md border border-cyan-400/15 bg-[#06111d]/90 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-500">{visibleTechs.length} visible nodes</div>
      <div className="absolute left-3 top-3 pointer-events-none rounded-md border border-cyan-400/10 bg-[#06111d]/70 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-300/45">Research Network · Live</div>
    </div>
  );
}
