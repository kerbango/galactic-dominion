import React, { useMemo } from 'react';
import { UNITS, isUnitUnlocked } from '@/data/units';
import ShipRegistryCard from './ShipRegistryCard';
import { TECH_TREE } from '@/data/techTree';

const techNameById = Object.fromEntries(TECH_TREE.map((t) => [t.id, t.name]));

function SectionHeader({ title, subtitle, count, accent }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-1.5 h-6 rounded-full ${accent}`} />
      <div className="flex-1">
        <h2 className="font-heading text-sm tracking-[0.12em] text-white uppercase">{title}</h2>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{subtitle}</p>
      </div>
      <span className="font-mono text-xs text-slate-400">{count}</span>
    </div>
  );
}

export default function ShipRegistry({ completedIds }) {
  const { unlocked, locked } = useMemo(() => {
    const unlocked = [];
    const locked = [];
    for (const unit of UNITS) {
      if (isUnitUnlocked(unit, completedIds)) unlocked.push(unit);
      else locked.push(unit);
    }
    return { unlocked, locked };
  }, [completedIds]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Unlocked Hulls" subtitle="Research complete · full deployment access" count={unlocked.length} accent="bg-emerald-400" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {unlocked.map((unit) => <ShipRegistryCard key={unit.id} unit={unit} unlocked={true} />)}
        </div>
      </div>

      {locked.length > 0 && (
        <div>
          <SectionHeader title="Locked Hulls" subtitle="Restricted · research gating tech to deploy" count={locked.length} accent="bg-amber-400" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((unit) => {
              const gatingTechName = techNameById[unit.gatingTechId] || unit.gatingTechId?.replace(/_/g, ' ') || 'Unknown';
              return <ShipRegistryCard key={unit.id} unit={unit} unlocked={false} gatingTechName={gatingTechName} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}