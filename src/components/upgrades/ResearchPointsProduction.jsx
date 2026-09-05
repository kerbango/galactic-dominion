import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { RESEARCH_POINTS_TIERS, nextResearchPointsTier, researchHourlyRate } from '@/data/techTree';
import { FlaskConical, Loader2 } from 'lucide-react';
import TierPadRow from './TierPadRow';
import CostChip from './CostChip';
import { purchaseErrorMessage } from '@/lib/upgradeError';

// Research Point Synthesis — a flat RP/hr boost upgrade. Each tier adds a
// fixed Research Points per hour bonus to the empire's base rate. The base
// rate is fixed and only grows through this upgrade, the quantum_computing
// tech, and the Research Accelerator upgrade. Martial Law does not affect RP.
export default function ResearchPointsProduction() {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const level = empire?.research_points_production_level || 0;
  const next = nextResearchPointsTier(level);
  const maxed = !next;
  const rpPerHour = researchHourlyRate(empire, new Set());

  const buy = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buyResearchPointsUpgrade', {});
      if (res?.data?.error) { setError(purchaseErrorMessage(res.data.error)); return; }
      await refresh(res?.data?.empire);
    } catch (e) {
      setError(purchaseErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border border-fuchsia-400/25 bg-fuchsia-400/5">
          <FlaskConical className="w-5 h-5 text-fuchsia-300" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-base text-white tracking-wide uppercase">Research Point Synthesis</h2>
          <p className="text-[11px] text-slate-400 font-body leading-snug">
            Flat RP/hr boost to your base research output. Current: <span className="text-fuchsia-300 font-semibold">{rpPerHour} RP/hr</span>
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {RESEARCH_POINTS_TIERS.map((tier) => {
          const owned = level >= tier.level;
          const isNext = next?.level === tier.level;
          const status = owned ? 'owned' : isNext ? 'next' : 'locked';
          return (
            <TierPadRow
              key={tier.level}
              label={`Level ${tier.level} · +${tier.rpHourlyBonus} RP/hr`}
              status={status}
            />
          );
        })}
      </div>

      <div className="mt-auto">
        {maxed ? (
          <div className="rounded-lg py-2.5 text-center font-heading text-xs uppercase tracking-wide bg-white/5 border border-slate-500/30 text-slate-400">Maximum Synthesis</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
              {Object.entries(next.cost).filter(([, v]) => v > 0).map(([k, v]) => (
                <CostChip key={k} resourceKey={k} value={v} />
              ))}
            </div>
            <button
              onClick={buy}
              disabled={busy}
              className="pcb-btn w-full rounded-lg py-2.5 font-heading text-xs uppercase tracking-wide disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? 'Purchasing…' : `Purchase Level ${next.level} · +${next.rpHourlyBonus} RP/hr`}
            </button>
          </>
        )}
        {error && <p className="text-xs text-rose-300 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}