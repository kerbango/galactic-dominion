import React from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { unitClass } from '@/lib/unitClasses';
import { isUnitUnlocked } from '@/data/units';
import { getShipArt } from '@/data/shipArt';
import ShipSilhouette, { SILHOUETTE_VARIANT } from './ShipSilhouette';
import { Image } from '@/components/ui/image';

// Mobile-only ship selector: prev/next arrows flanking a horizontal scroll
// strip of ship thumbnails. Touch-friendly, keeps artwork large on phone.
export default function MobileShipSelector({ units, unitRecords, completedIds, selectedId, onSelect, className = '' }) {
  const idx = Math.max(0, units.findIndex((u) => u.id === selectedId));
  const go = (dir) => {
    if (!units.length) return;
    const n = (idx + dir + units.length) % units.length;
    onSelect(units[n].id);
  };

  return (
    <div className={`glass-panel-strong rounded-xl p-2 flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => go(-1)}
        className="shrink-0 w-9 h-9 rounded-md border border-cyan-400/30 flex items-center justify-center text-cyan-200 hover:bg-cyan-400/10"
        aria-label="Previous ship"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 px-1">
          {units.map((unit) => {
            const sel = unit.id === selectedId;
            const rec = unitRecords[unit.id];
            const owned = rec?.owned_count || 0;
            const unlocked = isUnitUnlocked(unit, completedIds);
            const art = getShipArt(unit.id);
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => onSelect(unit.id)}
                className={`shrink-0 w-20 rounded-lg border p-1.5 text-center transition-colors ${sel ? 'border-cyan-400/70 bg-cyan-400/10' : 'border-cyan-400/15 bg-slate-900/30'}`}
              >
                <div className="h-8 flex items-center justify-center">
                  {unlocked ? (
                    art?.art
                      ? <Image src={art.art} fittingType="fit" className="w-full h-8" />
                      : <ShipSilhouette variant={SILHOUETTE_VARIANT[unitClass(unit)] || 'medium'} className="w-full h-8" />
                  ) : <Lock className="w-3.5 h-3.5 text-slate-600 mx-auto" />}
                </div>
                <p className="text-[8px] font-mono uppercase tracking-wide truncate mt-0.5 text-slate-300">{unit.name}</p>
                <p className="text-[8px] font-mono text-cyan-300/70">×{unlocked ? owned : '—'}</p>
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        className="shrink-0 w-9 h-9 rounded-md border border-cyan-400/30 flex items-center justify-center text-cyan-200 hover:bg-cyan-400/10"
        aria-label="Next ship"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}