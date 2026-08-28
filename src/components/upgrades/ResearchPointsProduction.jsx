import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { RESEARCH_POINTS_TIERS, nextResearchPointsTier, researchPointsPerCycle } from '@/data/techTree';
import { FlaskConical, Loader2 } from 'lucide-react';
import TierPadRow from './TierPadRow';
import CostChip from './CostChip';

// Tiered Research Points production upgrade. Each level adds +1 Research
// Point per production cycle (base 1), so level L produces (1 + L)/cycle.
// Buying deducts the tier's resource cost atomically via the
// buyResearchPointsUpgrade backend function, then refreshes the empire so
// the new rate is reflected immediately.
export default function ResearchPointsProduction() {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const level = empire?.research_points_production_level || 0;
  const next = nextResearchPointsTier(level);
  const maxed = !next;
  const currentRate = researchPointsPerCycle(level);

  const buy = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buyResearchPointsUpgrade', {});
      if (res?.data?.error) { setError(res.data.error); return; }
      await refresh();
    } catch (e) {
      setError(e?.message || 'Purchase failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pcb-panel rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="pcb-chip rounded-lg w-12 h-12 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-fuchsia-300" />
        </div>
        <div className="min-w-0">
          <h2 className="pcb-silkscreen text-base text-[#e0e0e0]">Research Point Synthesis</h2>
          <p className="text-[11px] text-slate-400 font-body leading-snug">
            Boost Research Points produced each cycle. Current output: <span className="text-fuchsia-300 font-semibold">{currentRate}/cycle</span>.
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
              label={`Level ${tier.level} · +${tier.bonus}/cycle (${researchPointsPerCycle(tier.level)} total)`}
              status={status}
            />
          );
        })}
      </div>

      <div className="mt-auto">
        {maxed ? (
          <div className="pcb-maxed rounded-lg py-2.5 text-center pcb-silkscreen text-xs">Maximum Synthesis</div>
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
              className="pcb-btn w-full rounded-lg py-2.5 pcb-silkscreen text-xs disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? 'Purchasing…' : `Purchase Level ${next.level} · +${next.bonus}/cycle`}
            </button>
          </>
        )}
        {error && <p className="text-xs text-rose-300 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}