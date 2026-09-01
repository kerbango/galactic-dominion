import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';
import ResearchSpeedUpgrade from '@/components/upgrades/ResearchSpeedUpgrade';
import ResearchPointsProduction from '@/components/upgrades/ResearchPointsProduction';
import EmpireUpgradeCard from '@/components/upgrades/EmpireUpgradeCard';
import BonusDashboard from '@/components/upgrades/BonusDashboard';
import { EMPIRE_UPGRADES, isEmpireUpgradeAvailable } from '@/data/empireUpgrades';
import { Wrench, Loader2 } from 'lucide-react';

const UPGRADES_BG = "https://media.base44.com/images/public/6a8dedaa90af486a558f758e/9e981c261_ChatGPTImageAug29202607_36_06AM.png";

// Upgrades are driven by the canonical research dataset. Research completes
// a technology first; its linked permanent upgrade then becomes available here.
export default function Upgrades() {
  const { empire } = useEmpire();
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
  useCycleRefresh(empire?.last_tick_date, loadProgress);

  const completedIds = useMemo(
    () => new Set(Object.entries(progress || {}).filter(([, r]) => r?.status === 'completed').map(([id]) => id)),
    [progress]
  );

  const availableCount = useMemo(
    () => EMPIRE_UPGRADES.filter((u) => isEmpireUpgradeAvailable(u, completedIds)).length,
    [completedIds]
  );

  if (!progress) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050810] pointer-events-none">
        <img src={UPGRADES_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.45) 0%, rgba(5,8,16,0.7) 60%, rgba(5,8,16,0.9) 100%)' }} />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <Wrench className="w-7 h-7 text-cyan-300 mb-2" />
          <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">Imperial Upgrades</h1>
          <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">
            Permanent enhancements unlocked through research.
          </p>
          <p className="text-[10px] text-amber-300/70 font-heading tracking-wider uppercase mt-2">
            {availableCount} research-gated upgrade{availableCount === 1 ? '' : 's'} currently available
          </p>
        </div>

        <BonusDashboard completedIds={completedIds} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {EMPIRE_UPGRADES.map((upgrade) => (
            <EmpireUpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              unlocked={isEmpireUpgradeAvailable(upgrade, completedIds)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResearchSpeedUpgrade />
          <ResearchPointsProduction />
        </div>

        <p className="font-heading text-[10px] tracking-[0.2em] text-cyan-300/40 text-center mt-6 uppercase">
          Imperial Upgrades · Aethernet Systems
        </p>
      </div>
    </>
  );
}
