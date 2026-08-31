import React, { useState } from 'react';
import { Lock, Crosshair, FileSpreadsheet, Eye } from 'lucide-react';
import { unitClass, unitClassLabel, unitRole } from '@/lib/unitClasses';
import { getShipArt } from '@/data/shipArt';
import ShipSilhouette, { SILHOUETTE_VARIANT } from './ShipSilhouette';
import { Image } from '@/components/ui/image';

// Centerpiece: a holographic inspection bay for the selected ship. Renders
// the registered artwork (if any) or a tasteful SVG silhouette over a
// tactical grid with scan lines, targeting brackets and a slow idle float.
// VIEW SCHEMATICS toggles a wireframe blueprint rendering (or the registered
// schematic asset). No fabricated assets — falls back to the silhouette.
export default function ShipVisualization({ unit, unlocked, className = '' }) {
  const [mode, setMode] = useState('visual');

  if (!unit) {
    return <div className={`glass-panel-strong rounded-2xl p-10 flex items-center justify-center text-slate-500 text-sm ${className}`}>No hull selected.</div>;
  }

  const art = getShipArt(unit.id);
  const variant = SILHOUETTE_VARIANT[unitClass(unit)] || 'medium';
  const showSchematic = mode === 'schematic';
  const hasArt = !!art?.art;
  const hasSchematic = !!art?.schematic;

  return (
    <div className={`glass-panel-strong rounded-2xl flex flex-col overflow-hidden ${className}`}>
      <div className="relative flex-1 min-h-[300px] md:min-h-[400px] overflow-hidden">
        {/* tactical grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* radial vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(8,20,40,0) 25%, rgba(5,8,16,0.85) 100%)' }} />
        {/* corner targeting brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-cyan-400/50" />
        <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-cyan-400/50" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-cyan-400/50" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-400/50" />
        {/* scan line */}
        <div className="absolute left-0 right-0 h-px bg-cyan-400/50 animate-scan-line pointer-events-none" />
        <div className="scanline-overlay" />

        {/* header tag */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <Crosshair className="w-3 h-3 text-cyan-300/70" />
          <span className="command-label">Holographic Inspection</span>
        </div>

        {/* ship */}
        <div className="absolute inset-0 flex items-center justify-center p-10">
          {unlocked ? (
            showSchematic && hasSchematic ? (
              <Image src={art.schematic} fittingType="fit" className="max-h-[300px] md:max-h-[340px]" />
            ) : !showSchematic && hasArt ? (
              <Image src={art.art} fittingType="fit" className="w-full max-w-[440px] h-[280px] md:h-[320px] animate-float-slow" />
            ) : (
              <ShipSilhouette variant={variant} wireframe={showSchematic} className="w-full max-w-[440px] animate-float-slow" />
            )
          ) : (
            <div className="text-center">
              <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Classified Hull</p>
            </div>
          )}
        </div>

        {/* mode toggle */}
        {unlocked && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'visual' ? 'schematic' : 'visual'))}
              className="command-btn rounded-md px-3 py-1.5 text-[10px] font-heading uppercase tracking-widest inline-flex items-center gap-1.5"
            >
              {showSchematic ? <><Eye className="w-3 h-3" /> Return to Visual</> : <><FileSpreadsheet className="w-3 h-3" /> View Schematics</>}
            </button>
          </div>
        )}
      </div>

      {/* identity */}
      <div className="px-4 py-3 border-t border-cyan-400/15 text-center">
        <h2 className="font-heading text-xl md:text-2xl tracking-[0.1em] text-white uppercase">{unlocked ? unit.name : '████████'}</h2>
        <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/70 mt-0.5">{unitClassLabel(unit)} · {unitRole(unit)}</p>
      </div>
    </div>
  );
}