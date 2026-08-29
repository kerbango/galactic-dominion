import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { nextEmpireUpgradeTier } from '@/data/empireUpgrades';
import { getTech } from '@/lib/techLayout';
import { Lock, Loader2, Zap } from 'lucide-react';
import TierPadRow from './TierPadRow';
import CostChip from './CostChip';
import { purchaseErrorMessage } from '@/lib/upgradeError';

// Generic card for a tech-gated empire-wide upgrade. The level is stored in
// the Empire's empire_upgrade_levels map. When the gating tech isn't
// completed the card shows a lock and the required tech name. Effects are
// combat-oriented and stored for later combat integration.
// The `wide` prop switches the tier rows to a 3-column grid for the wider
// bottom-row layout on the Upgrades page.
export default function EmpireUpgradeCard({ upgrade, unlocked, wide }) {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const levels = empire?.empire_upgrade_levels || {};
  const level = levels[upgrade.id] || 0;
  const next = nextEmpireUpgradeTier(upgrade, level);
  const maxed = !next;
  const gatingTech = getTech(upgrade.gatingTechId);

  const buy = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buyEmpireUpgrade', { upgrade_id: upgrade.id });
      if (res?.data?.error) { setError(purchaseErrorMessage(res.data.error)); return; }
      await refresh();
    } catch (e) {
      setError(purchaseErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col ${unlocked ? '' : 'opacity-75'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border ${unlocked ? 'border-amber-400/25 bg-amber-400/5' : 'border-cyan-400/20 bg-cyan-400/5'}`}>
          {unlocked ? <Zap className="w-5 h-5 text-amber-300" /> : <Lock className="w-5 h-5 text-cyan-300" />}
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-base text-white tracking-wide uppercase">{upgrade.name}</h2>
          <p className="text-[11px] text-slate-400 font-body leading-snug">{upgrade.description}</p>
        </div>
      </div>

      {!unlocked ? (
        <div className="mt-2 text-center">
          <p className="font-heading text-[10px] text-cyan-300/80 inline-flex items-center gap-1.5 uppercase tracking-wide">
            <Lock className="w-3.5 h-3.5" /> Requires {gatingTech?.name || upgrade.gatingTechId}
          </p>
        </div>
      ) : (
        <>
          <div className={`mb-4 space-y-2 ${wide ? 'md:grid md:grid-cols-3 md:gap-2 md:space-y-0' : ''}`}>
            {upgrade.tiers.map((tier) => {
              const owned = level >= tier.level;
              const isNext = next?.level === tier.level;
              const status = owned ? 'owned' : isNext ? 'next' : 'locked';
              return (
                <TierPadRow
                  key={tier.level}
                  label={`Tier ${tier.level} · +${Math.round(tier.bonus * 100)}% ${upgrade.effectLabel}`}
                  status={status}
                />
              );
            })}
          </div>
          <div className="mt-auto">
            {maxed ? (
              <div className="rounded-lg py-2.5 text-center font-heading text-xs uppercase tracking-wide bg-white/5 border border-slate-500/30 text-slate-400">Maximum</div>
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
                  {busy ? 'Purchasing…' : `Purchase Tier ${next.level} · +${Math.round(next.bonus * 100)}% ${upgrade.effectLabel}`}
                </button>
              </>
            )}
            {error && <p className="text-xs text-rose-300 mt-2 text-center">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}