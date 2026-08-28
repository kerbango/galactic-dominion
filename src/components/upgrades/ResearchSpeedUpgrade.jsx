import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { RESEARCH_SPEED_TIERS, nextResearchSpeedTier } from '@/data/techTree';
import { FlaskConical, Loader2 } from 'lucide-react';
import TierPadRow from './TierPadRow';

const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND' };

// Tiered research-speed upgrade ladder. Each level grants a total bonus
// (+10/+20/+30%) that stacks with the Quantum Computing tech bonus and
// applies dynamically to any in-progress research. Buying deducts the
// tier's resource cost atomically via the buyResearchSpeedUpgrade backend
// function, then refreshes the empire so the new level is reflected
// immediately on the Research page.
export default function ResearchSpeedUpgrade() {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const level = empire?.research_speed_level || 0;
  const next = nextResearchSpeedTier(level);
  const maxed = !next;

  const buy = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buyResearchSpeedUpgrade', {});
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
          <FlaskConical className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="min-w-0">
          <h2 className="pcb-silkscreen text-base text-[#e0e0e0]">Research Accelerator</h2>
          <p className="text-[11px] text-slate-400 font-body leading-snug">Shorten every research project. Stacks with the Quantum Computing bonus.</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {RESEARCH_SPEED_TIERS.map((tier) => {
          const owned = level >= tier.level;
          const isNext = next?.level === tier.level;
          const status = owned ? 'owned' : isNext ? 'next' : 'locked';
          return (
            <TierPadRow key={tier.level} label={`Level ${tier.level} · +${Math.round(tier.bonus * 100)}%`} status={status} />
          );
        })}
      </div>

      <div className="mt-auto">
        {maxed ? (
          <div className="pcb-maxed rounded-lg py-2.5 text-center pcb-silkscreen text-xs">Maximum Acceleration</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
              {Object.entries(next.cost).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="pcb-cost text-[10px] font-mono px-2 py-1 rounded">
                  {RES_LABELS[k] || k} <span className="text-cyan-300">{Math.floor(v).toLocaleString()}</span>
                </span>
              ))}
            </div>
            <button
              onClick={buy}
              disabled={busy}
              className="pcb-btn w-full rounded-lg py-2.5 pcb-silkscreen text-xs disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? 'Purchasing…' : `Purchase Level ${next.level} · +${Math.round(next.bonus * 100)}%`}
            </button>
          </>
        )}
        {error && <p className="text-xs text-rose-300 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}