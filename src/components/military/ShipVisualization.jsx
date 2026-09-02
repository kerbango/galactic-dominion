import React, { useState } from 'react';
import { Lock, Crosshair, FileSpreadsheet, Eye, Layers3 } from 'lucide-react';
import { unitClass, unitClassLabel, unitRole } from '@/lib/unitClasses';
import { getShipArt } from '@/data/shipArt';
import ShipSilhouette, { SILHOUETTE_VARIANT } from './ShipSilhouette';
import { Image } from '@/components/ui/image';

// Military ship inspection panel. Ship artwork is loaded directly from the
// registered Base44 CDN URLs so the game does not depend on image transforms.
export default function ShipVisualization({ unit, unlocked, className = '' }) {
  const [mode, setMode] = useState('visual');
  const [selectedVariant, setSelectedVariant] = useState(null);

  if (!unit) {
    return <div className={`glass-panel-strong rounded-2xl p-10 flex items-center justify-center text-slate-500 text-sm ${className}`}>No hull selected.</div>;
  }

  const art = getShipArt(unit.id);
  const fallbackVariant = SILHOUETTE_VARIANT[unitClass(unit)] || 'medium';
  const showSchematic = mode === 'schematic';
  const variants = art?.variants || [];
  const activeVariant = variants.find((v) => v.id === selectedVariant) || null;
  const displayArt = activeVariant?.art || art?.art;
  const imageClass = 'object-contain w-full max-w-[440px] h-[280px] md:h-[320px] animate-float-slow';

  return (
    <div className={`glass-panel-strong rounded-2xl flex flex-col overflow-hidden ${className}`}>
      <div className="relative flex-1 min-h-[300px] md:min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(8,20,40,0) 25%, rgba(5,8,16,0.85) 100%)' }} />
        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-cyan-400/50" />
        <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-cyan-400/50" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-cyan-400/50" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-400/50" />
        <div className="absolute left-0 right-0 h-px bg-cyan-400/50 animate-scan-line pointer-events-none" />
        <div className="scanline-overlay" />

        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          <Crosshair className="w-3 h-3 text-cyan-300/70" />
          <span className="command-label">Holographic Inspection</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-10 pb-20">
          {unlocked ? (
            showSchematic && art?.schematic ? (
              <Image src={art.schematic} fittingType="fit" alt={`${unit.name} technical blueprint`} className="w-full max-w-[560px] h-[340px]" loading="eager" />
            ) : displayArt ? (
              <Image src={displayArt} fittingType="fit" alt={`${unit.name}${activeVariant ? ` ${activeVariant.label}` : ''}`} className={imageClass} loading="eager" />
            ) : (
              <ShipSilhouette variant={fallbackVariant} wireframe={showSchematic} className="w-full max-w-[440px] animate-float-slow" />
            )
          ) : (
            <div className="text-center">
              <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Classified Hull</p>
            </div>
          )}
        </div>

        {unlocked && (art?.thumbnail || variants.length > 0) && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end gap-2 pointer-events-auto">
            {art?.thumbnail && (
              <button type="button" title="Base hull" onClick={() => setSelectedVariant(null)} className={`shrink-0 w-16 h-12 rounded-md border bg-slate-950/90 p-1 transition ${!activeVariant ? 'border-cyan-300/80 ring-1 ring-cyan-400/30' : 'border-cyan-400/20 hover:border-cyan-300/50'}`}>
                <Image src={art.thumbnail} fittingType="fit" alt="Base hull" className="w-full h-full" loading="eager" />
              </button>
            )}
            {variants.map((v) => (
              <button key={v.id} type="button" title={v.label} onClick={() => setSelectedVariant(v.id)} className={`shrink-0 w-16 h-12 rounded-md border bg-slate-950/90 p-1 transition ${activeVariant?.id === v.id ? 'border-cyan-300/80 ring-1 ring-cyan-400/30' : 'border-cyan-400/20 hover:border-cyan-300/50'}`}>
                <Image src={v.art} fittingType="fit" alt={v.label} className="w-full h-full" loading="eager" />
              </button>
            ))}
            {variants.length > 0 && <div className="ml-auto hidden sm:flex items-center gap-1 rounded-md border border-cyan-400/15 bg-slate-950/80 px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-cyan-200/55"><Layers3 className="w-3 h-3" /> {variants.length} variants</div>}
          </div>
        )}

        {unlocked && (
          <div className="absolute top-10 right-3 z-20">
            <button type="button" onClick={() => setMode((m) => (m === 'visual' ? 'schematic' : 'visual'))} className="command-btn rounded-md px-3 py-1.5 text-[10px] font-heading uppercase tracking-widest inline-flex items-center gap-1.5">
              {showSchematic ? <><Eye className="w-3 h-3" /> Return to Visual</> : <><FileSpreadsheet className="w-3 h-3" /> View Schematics</>}
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-cyan-400/15 text-center">
        <h2 className="font-heading text-xl md:text-2xl tracking-[0.1em] text-white uppercase">{unlocked ? unit.name : '████████'}</h2>
        <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/70 mt-0.5">{unitClassLabel(unit)} · {unitRole(unit)}</p>
        {activeVariant && <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-amber-300/80 mt-1">Variant · {activeVariant.label}</p>}
      </div>
    </div>
  );
}
