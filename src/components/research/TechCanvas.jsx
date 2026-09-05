import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize, Crosshair, Move, ChevronRight } from 'lucide-react';
import TechNode from './TechNode';
import TechIcon from './techIcons';
import { TECH_TREE, CATEGORY_ORDER, CATEGORIES } from '@/data/techTree';
import { getTechnologyState, getConnectionState, TIER_W, PAD_LEFT, PAD_TOP, CATEGORY_THEME } from '@/lib/techLayout';

const LINE_WIDTH = { active: 2.8, dormant: 1.15, inactive: 0 };

export default function TechCanvas({ statusMap, edges, layout, selectedId, onSelect, visibleIds, progress }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(0.72);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ w: 800, h: 600 });
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const panRef = useRef(pan); panRef.current = pan;
  const { pos, worldW, worldH, categories = CATEGORY_ORDER, laneBase = {}, laneHeight = {}, minTier = 1, maxTier = 6 } = layout;

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
    const nz = Math.max(0.24, Math.min(2.2, zoomRef.current * factor));
    const wx = (px - panRef.current.x) / zoomRef.current;
    const wy = (py - panRef.current.y) / zoomRef.current;
    setZoom(nz);
    setPan({ x: px - wx * nz, y: py - wy * nz });
  };
  const zoomCenter = (factor) => {
    const rect = containerRef.current.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  };

  const onPointerDown = (e) => {
    if (e.target.closest?.('button')) return;
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
      const factor = Math.hypot(p1.x - p2.x, p1.y - p2.y) / pinch.current.dist;
      const rect = containerRef.current.getBoundingClientRect();
      const px = pinch.current.mid.x - rect.left;
      const py = pinch.current.mid.y - rect.top;
      const nz = Math.max(0.24, Math.min(2.2, pinch.current.zoom * factor));
      const wx = (px - pinch.current.pan.x) / pinch.current.zoom;
      const wy = (py - pinch.current.pan.y) / pinch.current.zoom;
      setZoom(nz); setPan({ x: px - wx * nz, y: py - wy * nz });
      return;
    }
    if (drag.current) setPan({ x: drag.current.pan.x + e.clientX - drag.current.startX, y: drag.current.pan.y + e.clientY - drag.current.startY });
  };
  const endDrag = (e) => {
    pointers.current.delete(e.pointerId);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!pointers.current.size) drag.current = null;
  };

  const fitToScreen = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !worldW || !worldH) return;
    const nz = Math.max(0.24, Math.min(0.9, Math.min((rect.width - 24) / worldW, (rect.height - 24) / worldH)));
    setZoom(nz);
    setPan({ x: Math.max(12, (rect.width - worldW * nz) / 2), y: Math.max(12, (rect.height - worldH * nz) / 2) });
  };
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
  const visibleTechs = useMemo(() => TECH_TREE.filter((t) => {
    const p = pos[t.id];
    if (!p || (visibleIds && !visibleIds.has(t.id))) return false;
    return p.x + p.w + 140 >= viewLeft && p.x - 140 <= viewLeft + viewW && p.y + p.h + 140 >= viewTop && p.y - 140 <= viewTop + viewH;
  }), [pos, visibleIds, viewLeft, viewTop, viewW, viewH]);

  useEffect(() => { if (size.w > 0 && size.h > 0) fitToScreen(); }, [worldW, worldH, size.w, size.h]);

  const laneData = categories.map((category) => ({ category, top: laneBase[category] || 0, height: laneHeight[category] || 160, theme: CATEGORY_THEME[category] || CATEGORY_THEME['Fleet Research'] }));
  const tiers = Array.from({ length: maxTier - minTier + 1 }, (_, i) => minTier + i);

  return (
    <div className="relative w-full" style={{ height: 'min(84dvh, 980px)' }}>
      <style>{`@keyframes nexusFlow { to { stroke-dashoffset: -28; } } @keyframes nexusPulse { 0%,100% { opacity:.6; } 50% { opacity:1; } } @keyframes nexusScan { from { transform:translateX(-100%); } to { transform:translateX(100%); } } .nexus-edge { transition: opacity 600ms ease-in-out, stroke-width 600ms ease-in-out; }`}</style>
      <div ref={containerRef} className="relative w-full h-full overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,rgba(15,23,42,0.45),transparent_58%)]" />
        <div className="absolute origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: worldW, height: worldH }}>
          <div className="absolute inset-0" style={{ backgroundColor: '#01050a', backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(56,189,248,.045), transparent 28%), radial-gradient(circle at 80% 70%, rgba(168,85,247,.04), transparent 30%), linear-gradient(rgba(148,163,184,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.035) 1px, transparent 1px)', backgroundSize: '100% 100%,100% 100%,36px 36px,36px 36px' }} />

          {/* Tier progression header */}
          <div className="absolute left-0 top-0 right-0 h-[68px] border-b border-white/10 bg-black/35 backdrop-blur-sm" />
          {tiers.map((tier) => (
            <div key={tier} className="absolute top-0 h-[68px] flex flex-col justify-center" style={{ left: PAD_LEFT + tier * TIER_W, width: TIER_W }}>
              <div className="flex items-center gap-2 px-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">RESEARCH TIER</span>
                <span className="font-heading text-sm tracking-[0.18em] text-white">{String(tier).padStart(2, '0')}</span>
              </div>
              <div className="mt-2 mx-3 h-px" style={{ background: `linear-gradient(90deg, ${CATEGORY_THEME['Fleet Research'].accent}55, transparent)` }} />
            </div>
          ))}

          {/* Colored discipline lanes */}
          {laneData.map(({ category, top, height, theme }) => {
            const cat = CATEGORIES[category];
            return (
              <div key={category} className="absolute left-2 right-2 rounded-2xl border pointer-events-none overflow-hidden" style={{ top, height, borderColor: `${theme.accent}2d`, background: `linear-gradient(90deg, ${theme.soft}, rgba(2,7,13,0.12) 35%, rgba(2,7,13,0.02))`, boxShadow: `inset 0 0 60px ${theme.accent}0b` }}>
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg border flex items-center justify-center bg-black/35" style={{ borderColor: `${theme.accent}66`, color: theme.bright }}><TechIcon name={cat?.icon || 'Cpu'} className="w-3.5 h-3.5" /></div>
                  <div><div className="font-heading text-[10px] uppercase tracking-[0.16em]" style={{ color: theme.bright }}>{category}</div><div className="font-mono text-[7px] uppercase tracking-widest text-slate-600">DISCIPLINE</div></div>
                </div>
                <div className="absolute left-[272px] top-0 bottom-0 w-px" style={{ background: `linear-gradient(transparent, ${theme.accent}18, transparent)` }} />
              </div>
            );
          })}

          {/* Network layer: only the research frontier is energized. */}
          <svg className="absolute inset-0 pointer-events-none" width={worldW} height={worldH} style={{ overflow: 'visible', zIndex: 4 }}>
            <defs>
              <filter id="nexusGlow"><feGaussianBlur stdDeviation="3.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <marker id="nexusArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8 Z" fill="currentColor" /></marker>
            </defs>
            {edges.map((ed, i) => {
              const from = pos[ed.from], to = pos[ed.to];
              if (!from || !to) return null;
              const ft = TECH_TREE.find((t) => t.id === ed.from), tt = TECH_TREE.find((t) => t.id === ed.to);
              const fs = getTechnologyState(ft || { id: ed.from }, statusMap), ts = getTechnologyState(tt || { id: ed.to }, statusMap);
              const cs = getConnectionState(fs, ts);
              if (cs !== 'active') return null;
              const theme = CATEGORY_THEME[tt?.category] || CATEGORY_THEME['Fleet Research'];
              const x1 = from.x + from.w, y1 = from.y + from.h / 2;
              const x2 = to.x, y2 = to.y + to.h / 2;
              const gap = Math.max(34, (x2 - x1) / 2);
              const d = `M ${x1} ${y1} C ${x1 + gap * .55} ${y1}, ${x2 - gap * .55} ${y2}, ${x2} ${y2}`;
              const selected = selectedId && (ed.from === selectedId || ed.to === selectedId);
              const stroke = theme.line;
              return (
                <g key={`${ed.from}-${ed.to}-${i}`} style={{ color: stroke }}>
                  <path d={d} fill="none" stroke={stroke} strokeWidth={8} opacity={0.10} filter="url(#nexusGlow)" className="nexus-edge" style={{ animation: 'nexusPulse 2s ease-in-out infinite' }} />
                  <path d={d} fill="none" stroke={stroke} strokeWidth={LINE_WIDTH.active} strokeLinecap="round" strokeDasharray="2 12" className="nexus-edge" style={{ animation: 'nexusFlow .8s linear infinite, nexusPulse 2s ease-in-out infinite' }} markerEnd="url(#nexusArrow)" />
                  <circle r={4} fill={theme.bright} filter="url(#nexusGlow)"><animateMotion dur="1.7s" repeatCount="indefinite" path={d} /></circle>
                  {selected && <path d={d} fill="none" stroke="#fff" strokeWidth="1" opacity=".55" strokeDasharray="1 8" />}
                </g>
              );
            })}
          </svg>

          {/* Start marker */}
          <div className="absolute z-10 flex flex-col items-center justify-center rounded-full border-2 bg-[#02070d]" style={{ left: 22, top: PAD_TOP + 12, width: 58, height: 58, borderColor: '#67e8f9', boxShadow: '0 0 28px rgba(34,211,238,.22)' }}>
            <span className="font-heading text-[9px] text-cyan-200 tracking-[0.16em]">START</span><span className="font-mono text-[6px] text-slate-500">NEXUS</span>
          </div>

          <div className="absolute inset-0" style={{ zIndex: 8 }}>
            {visibleTechs.map((t) => <TechNode key={t.id} tech={t} state={getTechnologyState(t, statusMap)} position={pos[t.id]} selected={selectedId === t.id} onClick={() => onSelect(t.id)} progress={progress?.[t.id]} />)}
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex gap-1.5">
        <button onClick={() => zoomCenter(1.3)} className="w-9 h-9 rounded-lg border border-white/10 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 hover:border-cyan-300/50" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <button onClick={() => zoomCenter(1 / 1.3)} className="w-9 h-9 rounded-lg border border-white/10 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 hover:border-cyan-300/50" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        <button onClick={centerSelected} disabled={!selectedId} className="w-9 h-9 rounded-lg border border-white/10 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 disabled:opacity-30" title="Center selected"><Crosshair className="w-4 h-4" /></button>
        <button onClick={fitToScreen} className="w-9 h-9 rounded-lg border border-white/10 bg-[#06111d]/90 flex items-center justify-center text-cyan-200 hover:border-cyan-300/50" title="Fit entire tree"><Maximize className="w-4 h-4" /></button>
      </div>

      <div className="absolute left-3 bottom-3 flex items-center gap-3 rounded-lg border border-white/10 bg-[#06111d]/92 px-3 py-2 text-[8px] font-mono uppercase tracking-widest text-slate-400">
        <Move className="w-3 h-3 text-cyan-400" /> Drag · Zoom · Click technology
        <span className="h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1 text-amber-300"><span className="w-2 h-2 rounded-full bg-amber-300" /> Frontier</span>
      </div>
      <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-lg border border-white/10 bg-[#06111d]/92 px-3 py-2 text-[8px] font-mono uppercase tracking-widest text-slate-500">
        <ChevronRight className="w-3 h-3 text-cyan-400" /> Tier progression {minTier} → {maxTier} · {visibleTechs.length} nodes
      </div>
    </div>
  );
}