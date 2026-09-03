import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react';
import CostChip from './CostChip';
import { purchaseErrorMessage } from '@/lib/upgradeError';

// One-time empire upgrade that increases concurrent research capacity from
// one technology to two. The backend enforces the purchased capacity.
export default function ParallelResearchUpgrade() {
  const { empire, refresh } = useEmpire();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const purchased = (empire?.parallel_research_level || 0) >= 1;

  const buy = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('buyParallelResearchUpgrade', {});
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
        <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border border-amber-400/30 bg-amber-400/5">
          <FlaskConical className="w-5 h-5 text-amber-300" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-base text-white tracking-wide uppercase">Parallel Research</h2>
          <p className="text-[11px] text-slate-400 font-body leading-snug">Expand the Research Nexus to run two technologies at the same time.</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="rounded-lg border border-slate-700/50 bg-[#02070d]/70 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Research Capacity</span>
          <span className={`text-xs font-mono font-semibold ${purchased ? 'text-emerald-300' : 'text-cyan-200'}`}>{purchased ? '2 technologies' : '1 technology'}</span>
        </div>
        <div className="rounded-lg border border-slate-700/50 bg-[#02070d]/70 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Upgrade Effect</span>
          <span className="text-xs font-mono text-amber-300">+1 research slot</span>
        </div>
      </div>

      <div className="mt-auto">
        {purchased ? (
          <div className="rounded-lg py-2.5 text-center font-heading text-xs uppercase tracking-wide bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 inline-flex items-center justify-center gap-2 w-full">
            <CheckCircle2 className="w-4 h-4" /> Parallel Research Enabled
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
              <CostChip resourceKey="vrind" value={10000} />
            </div>
            <button
              onClick={buy}
              disabled={busy}
              className="pcb-btn w-full rounded-lg py-2.5 font-heading text-xs uppercase tracking-wide disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? 'Purchasing…' : 'Purchase Upgrade · 10,000 VRIND'}
            </button>
          </>
        )}
        {error && <p className="text-xs text-rose-300 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}