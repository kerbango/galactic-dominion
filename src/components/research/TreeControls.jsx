import React from "react";
import { Plus, Minus, Maximize } from "lucide-react";

export default function TreeControls({ onZoomIn, onZoomOut, onReset }) {
  const btn = "glass-panel-strong w-10 h-10 rounded-lg flex items-center justify-center text-cyan-200 hover:text-white border border-white/10 hover:border-cyan-400/60 transition";
  return (
    <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-2">
      <button onClick={onZoomIn} className={btn} title="Zoom in"><Plus className="w-5 h-5" /></button>
      <button onClick={onZoomOut} className={btn} title="Zoom out"><Minus className="w-5 h-5" /></button>
      <button onClick={onReset} className={btn} title="Reset view"><Maximize className="w-4 h-4" /></button>
    </div>
  );
}