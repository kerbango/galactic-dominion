import React, { useState } from 'react';
import { Image } from '@/components/ui/image';
import { getShipArt } from '@/data/shipArt';
import { getShipDescription } from '@/data/shipDescriptions';
import { unitClass, unitClassLabel, unitRole } from '@/lib/unitClasses';
import ShipSilhouette from './ShipSilhouette';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';

const STAT_KEYS = ['attack', 'defense', 'stealth', 'exploration', 'shielding', 'hull_armor', 'speed', 'range', 'efficiency'];

function StatRow({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="font-mono text-[10px] text-cyan-200 w-7 text-right">{value}</span>
    </div>
  );
}

function ArtOrSilhouette({ unit, artKey, className, variant }) {
  const art = getShipArt(unit.id);
  const url = art?.[artKey];
  if (url) {
    return <Image src={url} fittingType={artKey === 'schematic' ? 'fit' : 'fill'} className={className} />;
  }
  return (
    <div className={`flex items-center justify-center bg-black/30 ${className}`}>
      <ShipSilhouette variant={variant} wireframe={artKey === 'schematic'} className="w-full h-full p-4" />
    </div>
  );
}

export default function ShipRegistryCard({ unit, unlocked, gatingTechName }) {
  const [expanded, setExpanded] = useState(false);
  const variant = (unitClass(unit) || 'Support').toLowerCase();
  const stats = unit.baseStats || {};
  const description = getShipDescription(unit);

  return (
    <div className={`glass-panel rounded-xl overflow-hidden transition-all ${unlocked ? '' : 'opacity-70'}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-cyan-400/20 bg-black/30">
          <ArtOrSilhouette unit={unit} artKey="thumbnail" className="w-full h-full" variant={variant} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-xs tracking-wide text-white uppercase truncate">{unit.name}</h3>
            {!unlocked && <Lock className="w-3 h-3 text-amber-300 shrink-0" />}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{unitClassLabel(unit)} · {unitRole(unit)}</p>
          {!unlocked && gatingTechName && (
            <p className="font-mono text-[8px] uppercase tracking-widest text-amber-300/80 mt-0.5">Requires: {gatingTechName}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-cyan-300 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="command-label mb-1">Hero Art</p>
              <ArtOrSilhouette unit={unit} artKey="art" className="w-full h-40 rounded-lg overflow-hidden border border-cyan-400/15" variant={variant} />
            </div>
            <div>
              <p className="command-label mb-1">Schematic</p>
              <ArtOrSilhouette unit={unit} artKey="schematic" className="w-full h-40 rounded-lg overflow-hidden border border-cyan-400/15" variant={variant} />
            </div>
          </div>

          <div className="selectable-text">
            <p className="command-label mb-1">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
          </div>

          <div>
            <p className="command-label mb-1.5">Base Stats</p>
            <div className="space-y-1">
              {STAT_KEYS.map((k) => <StatRow key={k} label={k.replace('_', ' ')} value={stats[k] || 0} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}