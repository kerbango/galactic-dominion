import React from 'react';
import { Lock } from 'lucide-react';
import { unitClass } from '@/lib/unitClasses';
import { isUnitUnlocked } from '@/data/units';
import { getShipArt } from '@/data/shipArt';
import { SILHOUETTE_VARIANT } from './ShipSilhouette';
import ShipSilhouette from './ShipSilhouette';
import { Image } from '@/components/ui/image';

const STATUS = {
  locked: { led: 'led-dim', label: 'Locked', text: 'text-slate-500' },
  building: { led: 'led-amber', label: 'Building', text: 'text-amber-300' },
  ready: { led: 'led-green', label: 'Ready', text: 'text-emerald-300' },
};

const CLASS_ORDER = ['Scouts','Explorers','Frigates','Destroyers','Cruisers','Carriers','Capital','Support','Transport','Ground Forces','Defense'];

const ShipImage = ({ src, alt, className }) => (
  <img
    src={src}
    alt={alt}
    className={className}
    loading="eager"
    decoding="async"
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
);

// Left rail: ships grouped by class with thumbnail, name, status LED and
// owned count. Strong tactical selection state. Desktop only (mobile uses
// MobileShipSelector).
export default function ShipRoster({ units, unitRecords, completedIds, selectedId, onSelect, className = '' }) {
  const groups = {};
  for (const u of units) {
    const c = unitClass(u);
    (groups[c] = groups[c] || []).push(u);
  }
  const order = CLASS_ORDER.filter((c) => groups[c]);

  return (
    <div className={`glass-panel-strong rounded-2xl p-3 flex-col overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="led led-green" />
        <span className="command-label">Fleet Registry</span>
      </div>
      <div className="overflow-y-auto pr-1 space-y-3 flex-1 max-h-[70vh]">
        {order.map((cls) => (
          <div key={cls}>
            <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-300/60 px-1 mb-1">{cls}</p>
            <div className="space-y-1">
              {groups[cls].map((unit) => {
                const rec = unitRecords[unit.id];
                const owned = rec?.owned_count || 0;
                const building = !!rec?.construction_start_date;
                const unlocked = isUnitUnlocked(unit, completedIds);
                const status = !unlocked ? 'locked' : building ? 'building' : 'ready';
                const s = STATUS[status];
                const selected = selectedId === unit.id;
                const art = getShipArt(unit.id);
                return (
                  <button
                    key={unit.id}
                    onClick={() => onSelect(unit.id)}
                    className={`group w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-all border ${selected ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[inset_2px_0_0_rgba(56,189,248,0.75),0_0_18px_rgba(56,189,248,0.08)]' : 'border-transparent hover:border-cyan-400/15 hover:bg-slate-800/40'}`}
                  >
                    <span className={`led ${s.led}`} />
                    <span className="shrink-0 w-10 h-6 flex items-center justify-center">
                      {unlocked ? (
                        (art?.thumbnail || art?.art)
                          ? <ShipImage src={art.thumbnail || art.art} alt={unit.name} className="w-10 h-6 object-contain" />
                          : <ShipSilhouette variant={SILHOUETTE_VARIANT[unitClass(unit)] || 'medium'} className="w-10 h-6" />
                      ) : <Lock className="w-3.5 h-3.5 text-slate-600" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-heading text-[11px] tracking-wide text-white uppercase truncate">{unit.name}</span>
                      <span className={`block text-[8px] font-mono uppercase tracking-widest ${s.text}`}>{s.label}</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-cyan-200 tabular-nums leading-none">{unlocked ? owned : '—'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}