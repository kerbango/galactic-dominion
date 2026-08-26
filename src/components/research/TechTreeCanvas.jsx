import React, { useEffect, useRef, useState } from "react";
import { TECH_TREE } from "@/data/techTree";
import { computeLayout, getAncestors, getDescendants, NODE_W, NODE_H } from "@/lib/techLayout";
import TechNode from "./TechNode";
import ConnectionLines from "./ConnectionLines";
import TreeControls from "./TreeControls";
import Minimap from "./Minimap";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

export default function TechTreeCanvas({ statuses, progressMap, onSelect }) {
  const { pos } = computeLayout();
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const [hoveredId, setHoveredId] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Non-passive wheel zoom centered on the cursor.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => {
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (1 + delta)));
        const f = nz / z;
        setPan((p) => ({ x: cx - (cx - p.x) * f, y: cy - (cy - p.y) * f }));
        return nz;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onPointerUp = () => { drag.current = null; };

  const zoomBy = (factor) => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    setZoom((z) => {
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
      const f = nz / z;
      setPan((p) => ({ x: cx - (cx - p.x) * f, y: cy - (cy - p.y) * f }));
      return nz;
    });
  };
  const reset = () => { setZoom(0.7); setPan({ x: 24, y: 24 }); };
  const panTo = (worldX, worldY) => {
    setPan({ x: size.w / 2 - worldX * zoom, y: size.h / 2 - worldY * zoom });
  };

  const hoverSet = hoveredId
    ? new Set([hoveredId, ...getAncestors(hoveredId), ...getDescendants(hoveredId)])
    : null;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
        <ConnectionLines statuses={statuses} hoveredId={hoveredId} hoverSet={hoverSet} />
        {TECH_TREE.map((t) => {
          const p = pos[t.id];
          const dim = hoverSet && !hoverSet.has(t.id);
          const hl = hoverSet && hoverSet.has(t.id) && hoveredId !== t.id;
          return (
            <div key={t.id} style={{ position: "absolute", left: p.x, top: p.y, width: NODE_W, height: NODE_H }}>
              <TechNode
                tech={t}
                status={statuses[t.id]}
                progress={progressMap[t.id]?.progress}
                dimmed={dim}
                highlighted={hl}
                hovered={hoveredId === t.id}
                onHover={setHoveredId}
                onClick={onSelect}
              />
            </div>
          );
        })}
      </div>

      <TreeControls onZoomIn={() => zoomBy(1.25)} onZoomOut={() => zoomBy(0.8)} onReset={reset} />
      <Minimap statuses={statuses} view={{ x: pan.x, y: pan.y, zoom }} containerW={size.w} containerH={size.h} onPanTo={panTo} />
    </div>
  );
}