import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';
import ParallelResearchUpgrade from '@/components/upgrades/ParallelResearchUpgrade';
import ResearchSpeedUpgrade from '@/components/upgrades/ResearchSpeedUpgrade';
import ResearchPointsProduction from '@/components/upgrades/ResearchPointsProduction';
import EmpireUpgradeCard from '@/components/upgrades/EmpireUpgradeCard';
import BonusDashboard from '@/components/upgrades/BonusDashboard';
import { EMPIRE_UPGRADES, isEmpireUpgradeAvailable } from '@/data/empireUpgrades';
import { ECONOMY_TECH_IDS } from '@/data/techTree';
import { Wrench, Loader2, FlaskConical, Crown, ChevronDown, Sparkles, Coins } from 'lucide-react';

const UPGRADES_BG = "https://media.base44.com/images/public/6a8dedaa90af486a558f758e/9e981c261_ChatGPTImageAug29202607_36_06AM.png";

function CategorySection({ id, title, subtitle, icon: Icon, accent, count, open, onClick, children }) {
  return (
    <section className="mb-3">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left group"
        aria-expanded={open}
        aria-controls={`upgrade-category-${id}`}
      >
        <div className={`relative overflow-hidden border bg-slate-950/80 backdrop-blur-md transition-all duration-200 ${open ? `border-${accent}-400/50` : 'border-slate-700/70 hover:border-slate-500'}`}>
          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${accent}-400/80`} />
          <div className="flex items-center gap-4 px-5 py-4">
            <div className={`shrink-0 w-11 h-11 flex items-center justify-center border border-${accent}-400/30 bg-${accent}-400/10`}>
              <Icon className={`w-5 h-5 text-${accent}-300`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-sm md:text-base tracking-[0.16em] uppercase text-white">{title}</h2>
                <span className={`text-[9px] font-mono px-2 py-0.5 border border-${accent}-400/25 text-${accent}-300/80 bg-${accent}-400/5`}>
                  {count} UPGRADE{count === 1 ? '' : 'S'}
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 font-body mt-1">{subtitle}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180 text-white' : 'group-hover:text-slate-300'}`} />
          </div>
          {open && <div className={`h-px bg-${accent}-400/30`} />}
        </div>
      </button>

      {open && (
        <div id={`upgrade-category-${id}`} className="pt-3 pb-2">
          {children}
        </div>
      )}
    </section>
  );
}

// Upgrades are driven by the canonical research dataset. Research completes
// a technology first; its linked permanent upgrade then becomes available here.
export default function Upgrades() {
  const { empire } = useEmpire();
  const [progress, setProgress] = useState(null);
  const [openCategory, setOpenCategory] = useState(null);

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

  const economyUpgrades = useMemo(
    () => EMPIRE_UPGRADES.filter((u) => ECONOMY_TECH_IDS.has(u.gatingTechId)),
    []
  );
  const empireUpgrades = useMemo(
    () => EMPIRE_UPGRADES.filter((u) => !ECONOMY_TECH_IDS.has(u.gatingTechId)),
    []
  );

  if (!progress) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  const toggleCategory = (id) => setOpenCategory((current) => current === id ? null : id);

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

        <div className="mt-5">
          <CategorySection
            id="research"
            title="Research Systems"
            subtitle="Expand research capacity, speed, and knowledge production."
            icon={FlaskConical}
            accent="cyan"
            count={3}
            open={openCategory === 'research'}
            onClick={() => toggleCategory('research')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ParallelResearchUpgrade />
              <ResearchSpeedUpgrade />
              <ResearchPointsProduction />
            </div>
          </CategorySection>

          <CategorySection
            id="economy"
            title="Economy and Resources"
            subtitle="Permanent boosts to mining, energy, and material production."
            icon={Coins}
            accent="amber"
            count={economyUpgrades.length}
            open={openCategory === 'economy'}
            onClick={() => toggleCategory('economy')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {economyUpgrades.map((upgrade) => (
                <EmpireUpgradeCard
                  key={upgrade.id}
                  upgrade={upgrade}
                  unlocked={isEmpireUpgradeAvailable(upgrade, completedIds)}
                />
              ))}
            </div>
          </CategorySection>

          <CategorySection
            id="empire"
            title="Empire Systems"
            subtitle="Permanent improvements to the command, economy, and capabilities of your empire."
            icon={Crown}
            accent="violet"
            count={empireUpgrades.length}
            open={openCategory === 'empire'}
            onClick={() => toggleCategory('empire')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {empireUpgrades.map((upgrade) => (
                <EmpireUpgradeCard
                  key={upgrade.id}
                  upgrade={upgrade}
                  unlocked={isEmpireUpgradeAvailable(upgrade, completedIds)}
                />
              ))}
            </div>
          </CategorySection>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-cyan-300/30">
          <Sparkles className="w-3 h-3" />
          <p className="font-heading text-[10px] tracking-[0.2em] text-center uppercase">
            Imperial Upgrades · Aethernet Systems
          </p>
          <Sparkles className="w-3 h-3" />
        </div>
      </div>
    </>
  );
}