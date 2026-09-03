import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { canPurchaseEmpireUpgrade } from '@/data/empireUpgrades';
import { getTech } from '@/lib/techLayout';
import { Lock, Loader2, Zap, Check } from 'lucide-react';
import CostChip from './CostChip';
import { purchaseErrorMessage } from '@/lib/upgradeError';

// Generic card for a tech-gated empire-wide upgrade.
// Roman-numeral entries are distinct one-time purchases, not repeatable tiers.
export default function EmpireUpgradeCard({ upgrade, unlocked, wide }) {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const levels = empire?.empire_upgrade_levels || {};
  const purchased = (levels[upgrade.id] || 0) >= 1;
  const gatingTech = getTech(upgrade.gatingTechId);

  const buy = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buyEmpireUpgrade', { upgrade_id: upgrade.id });
      if (res?.data?.error) { setError(purchaseErrorMessage(res.data.error)); return; }
      await refresh(res?.data?.empire);
    } catch (e) {
      setError(purchaseErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const canBuy = unlocked && !purchased && canPurchaseEmpireUpgrade(upgrade, new Set(Object.keys(levels).filter((id) => levels[id] > 0)));

  return (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col ${unlocked ? '' : 'opacity-75'} ${wide ? 'md:col-span-1' : ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border ${purchased ? 'border-emerald-400/40 bg-emerald-400/10' : unlocked ? 'border-amber-400/25 bg-amber-400/5' : 'border-cyan-400/20 bg-cyan-400/5'}`}>
          {purchased ? <Check className="w-5 h-5 text-emerald-300" /> : unlocked ? <Zap className="w-5 h-5 text-amber-300" /> : <Lock className="w-5 h-5 text-cyan-300" />}
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
      ) : purchased ? (
        <div className="mt-auto rounded-lg py-2.5 text-center font-heading text-xs uppercase tracking-wide bg-emerald-400/10 border border-emerald-400/30 text-emerald-300">
          Purchased · Permanent
        </div>
      ) : (
        <div className="mt-auto">
          <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
            {Object.entries(upgrade.cost || {}).filter(([, v]) => v > 0).map(([k, v]) => (
              <CostChip key={k} resourceKey={k} value={v} />
            ))}
          </div>
          <button
            onClick={buy}
            disabled={busy || !canBuy}
            className="pcb-btn w-full rounded-lg py-2.5 font-heading text-xs uppercase tracking-wide disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? 'Purchasing…' : 'Purchase Upgrade'}
          </button>
          {error && <p className="text-xs text-rose-300 mt-2 text-center">{error}</p>}
        </div>
      )}
    </div>
  );
}