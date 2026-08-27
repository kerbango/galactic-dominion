import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { RESEARCH_SPEED_TIERS, nextResearchSpeedTier } from '@/data/techTree';
import { FlaskConical, Zap, CheckCircle2, Lock, Loader2 } from 'lucide-react';

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
    <div className="glass-panel-strong rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-cyan-400/20 bg-cyan-400/10">
          <FlaskConical className="w-5 h-5 text-cyan-300" />
        </div>
        <div>
          <h2 className="font-heading text-lg tracking-wide text-white uppercase">Research Accelerator</h2>
          <p className="text-xs text-muted-foreground font-body">Shorten every research project. Stacks with the Quantum Computing bonus.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {RESEARCH_SPEED_TIERS.map((tier) => {
          const owned = level >= tier.level;
          const isNext = next?.level === tier.level;
          const cls = owned
            ? 'border-emerald-400/30 bg-emerald-400/5'
            : isNext
              ? 'border-amber-400/40 bg-amber-400/5'
              : 'border-slate-700/40 bg-slate-800/30';
          const Icon = owned ? CheckCircle2 : isNext ? Zap : Lock;
          const iconCls = owned ? 'text-emerald-300' : isNext ? 'text-amber-300' : 'text-slate-500';
          return (
            <div key={tier.level} className={`rounded-xl border p-4 flex items-center gap-4 ${cls}`}>
              <div className="shrink-0">
                <Icon className={`w-5 h-5 ${iconCls}`} />
              </div>
              <div className="flex-1">
                <p className="font-heading text-sm tracking-wide text-white uppercase">Level {tier.level} · +{Math.round(tier.bonus * 100)}%</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(tier.cost).filter(([, v]) => v > 0).map(([k, v]) => (
                    <span key={k} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-200">
                      {RES_LABELS[k] || k}: <span className="text-cyan-200">{Math.floor(v).toLocaleString()}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        {maxed ? (
          <div className="w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 font-heading text-sm tracking-wide uppercase py-2.5 text-center">
            Maximum Acceleration
          </div>
        ) : (
          <button
            onClick={buy}
            disabled={busy}
            className="w-full rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-900 font-heading text-sm tracking-wide uppercase py-2.5 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? 'Purchasing…' : `Purchase Level ${next.level} · +${Math.round(next.bonus * 100)}%`}
          </button>
        )}
        {error && <p className="text-xs text-rose-300 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}