import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import ResearchSpeedUpgrade from '@/components/upgrades/ResearchSpeedUpgrade';
import ResearchPointsProduction from '@/components/upgrades/ResearchPointsProduction';
import EmpireUpgradeCard from '@/components/upgrades/EmpireUpgradeCard';
import BonusDashboard from '@/components/upgrades/BonusDashboard';
import { EMPIRE_UPGRADES, isEmpireUpgradeAvailable } from '@/data/empireUpgrades';
import { Wrench, Loader2 } from 'lucide-react';

const UPGRADES_BG = "https://media.base44.com/images/public/6a8dedaa90af486a558f758e/d4a4244f4_ChatGPTImageAug28202609_39_29PM.png";

// Upgrades — empire-wide permanent enhancements. A summary-first layout:
// a bonus dashboard on top showing active empire bonuses as circular
// gauges, then a grid of glass-panel upgrade cards. Top row holds the three
// research-oriented upgrades (Research Accelerator, Research Point
// Synthesis, Plasma Efficiency); bottom row holds the two wider fleet
// combat upgrades (Reinforced Hull II, Heavy Armor). All purchasing flows
// through the existing backend functions and refresh the empire on
// completion.
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

  const plasmaUpgrade = EMPIRE_UPGRADES.find((u) => u.id === 'plasma_efficiency');
  const hullUpgrade = EMPIRE_UPGRADES.find((u) => u.id === 'reinforced_hull_ii');
  const armorUpgrade = EMPIRE_UPGRADES.find((u) => u.id === 'heavy_armor');

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
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Wrench className="w-7 h-7 text-cyan-300 mb-2" />
          <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">Imperial Upgrades</h1>
          <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">
            Permanent enhancements for your empire.
          </p>
        </div>

        {/* Bonus Dashboard */}
        <BonusDashboard completedIds={completedIds} />

        {/* Top row: 3 vertical cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <ResearchSpeedUpgrade />
          <ResearchPointsProduction />
          <EmpireUpgradeCard
            upgrade={plasmaUpgrade}
            unlocked={isEmpireUpgradeAvailable(plasmaUpgrade, completedIds)}
          />
        </div>

        {/* Bottom row: 2 wider cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmpireUpgradeCard
            upgrade={hullUpgrade}
            unlocked={isEmpireUpgradeAvailable(hullUpgrade, completedIds)}
            wide
          />
          <EmpireUpgradeCard
            upgrade={armorUpgrade}
            unlocked={isEmpireUpgradeAvailable(armorUpgrade, completedIds)}
            wide
          />
        </div>

        {/* Footer tagline */}
        <p className="font-heading text-[10px] tracking-[0.2em] text-cyan-300/40 text-center mt-6 uppercase">
          Imperial Upgrades · Aethernet Systems
        </p>
      </div>
    </>
  );
}