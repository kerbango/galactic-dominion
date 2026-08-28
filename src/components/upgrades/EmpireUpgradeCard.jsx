import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { nextEmpireUpgradeTier } from '@/data/empireUpgrades';
import { getTech } from '@/lib/techLayout';
import { Lock, Loader2, Zap } from 'lucide-react';
import TierPadRow from './TierPadRow';

const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium' };

// Generic card for a tech-gated empire-wide upgrade. The level is stored in
// the Empire's empire_upgrade_levels map. When the gating tech isn't
// completed the card shows a lock and the required tech name. Effects are
// combat-oriented and stored for later combat integration.
export default function EmpireUpgradeCard({ upgrade, unlocked }) {
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
      if (res?.data?.error) { setError(res.data.error); return; }
      await refresh();
    } catch (e) {
      setError(e?.message || 'Purchase failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`pcb-panel rounded-2xl p-5 flex flex-col ${unlocked ? '' : 'pcb-panel-locked'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`pcb-chip rounded-lg w-12 h-12 flex items-center justify-center shrink-0 ${unlocked ? '' : 'opacity-70'}`}>
          {unlocked ? <Zap className="w-5 h-5 text-amber-300" /> : <Lock className="w-5 h-5 text-cyan-300" />}
        </div>
        <div className="min-w-0">
          <h2 className="pcb-silkscreen text-base text-[#e0e0e0]">{upgrade.name}</h2>
          <p className="text-[11px] text-slate-400 font-body leading-snug">{upgrade.description}</p>
        </div>
      </div>

      {!unlocked ? (
        <div className="mt-2 text-center">
          <p className="pcb-silkscreen text-[10px] text-cyan-300/80 inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Requires {gatingTech?.name || upgrade.gatingTechId}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
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
              <div className="pcb-maxed rounded-lg py-2.5 text-center pcb-silkscreen text-xs">Maximum</div>
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