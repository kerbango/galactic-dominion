import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import ResearchSpeedUpgrade from '@/components/upgrades/ResearchSpeedUpgrade';
import ResearchPointsProduction from '@/components/upgrades/ResearchPointsProduction';
import EmpireUpgradeCard from '@/components/upgrades/EmpireUpgradeCard';
import PcbTraceOverlay from '@/components/upgrades/PcbTraceOverlay';
import { EMPIRE_UPGRADES, isEmpireUpgradeAvailable } from '@/data/empireUpgrades';

export default function Upgrades() {
  const [progress, setProgress] = useState(null);

  const loadProgress = useCallback(async () => {
    try {
      const recs = await base44.entities.TechProgress.list('-updated_date', 500);
      const map = {};
      for (const r of recs) map[r.tech_id] = r;
      setProgress(map);
    } catch {
      setProgress({});
    }
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);
  useEffect(() => {
    const unsub = base44.entities.TechProgress.subscribe(() => { loadProgress(); });
    return unsub;
  }, [loadProgress]);

  const completedIds = useMemo(
    () => new Set(Object.entries(progress || {}).filter(([, r]) => r?.status === 'completed').map(([id]) => id)),
    [progress]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center mb-2">
        <h1
          className="pcb-silkscreen text-2xl md:text-3xl text-[#e0e0e0]"
          style={{ textShadow: '0 0 14px rgba(0,212,255,0.4)' }}
        >
          Imperial Upgrades
        </h1>
        <p className="text-xs md:text-sm text-slate-400 font-body mt-1 tracking-wide uppercase">
          Permanent enhancements for your empire.
        </p>
      </div>

      <div className="pcb-trace w-32 mx-auto my-5" />

      <div className="relative pcb-grid-overlay rounded-2xl p-4 md:p-5">
        <PcbTraceOverlay />
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5" style={{ zIndex: 1 }}>
          <ResearchSpeedUpgrade />
          <ResearchPointsProduction />
          {EMPIRE_UPGRADES.map((u) => (
            <EmpireUpgradeCard
              key={u.id}
              upgrade={u}
              unlocked={progress ? isEmpireUpgradeAvailable(u, completedIds) : false}
            />
          ))}
        </div>
      </div>

      <p className="pcb-silkscreen text-[10px] text-cyan-300/40 text-center mt-6">
        Imperial Upgrades · Aethernet Systems
      </p>
    </div>
  );
}