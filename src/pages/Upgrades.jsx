import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import ResearchSpeedUpgrade from '@/components/upgrades/ResearchSpeedUpgrade';
import ResearchPointsProduction from '@/components/upgrades/ResearchPointsProduction';
import EmpireUpgradeCard from '@/components/upgrades/EmpireUpgradeCard';
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
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">Imperial Upgrades</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">Permanent enhancements for your empire.</p>
      </div>
      <ResearchSpeedUpgrade />
      <div className="mt-6">
        <ResearchPointsProduction />
      </div>
      {EMPIRE_UPGRADES.map((u) => (
        <div key={u.id} className="mt-6">
          <EmpireUpgradeCard upgrade={u} unlocked={progress ? isEmpireUpgradeAvailable(u, completedIds) : false} />
        </div>
      ))}
    </div>
  );
}