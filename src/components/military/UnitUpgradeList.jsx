import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { upgradesForUnit, unitUpgradeCost, nextUnitUpgradeLevel } from '@/data/unitUpgrades';
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, Sword, Shield, Gauge, Eye, ShieldHalf, Layers, Ruler, Zap } from 'lucide-react';

const RES_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium' };
const STAT_ICON = { attack: Sword, defense: Shield, stealth: Eye, shielding: ShieldHalf, hull_armor: Layers, speed: Gauge, range: Ruler, efficiency: Zap };

// Expandable list of per-unit-type upgrades shown under an unlocked ship.
// Each upgrade applies to all ships of that type; buying a level deducts the
// scaled cost via the buyUnitUpgrade backend function and refreshes the
// empire. Locked (unit not unlocked) renders nothing expandable.
export default function UnitUpgradeList({ unit, unitRecord, unlocked, onDone }) {
  const { refresh } = useEmpire();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const upgrades = upgradesForUnit(unit.id);
  const levels = unitRecord?.upgrade_levels || {};

  const buy = async (up) => {
    setError('');
    setBusyId(up.id);
    try {
      const res = await base44.functions.invoke('buyUnitUpgrade', { unit_type: unit.id, upgrade_id: up.id });
      if (res?.data?.error) { setError(res.data.error); return; }
      await refresh();
      onDone?.();
    } catch (e) {
      setError(e?.message || 'Purchase failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-3 border-t border-cyan-400/15 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!unlocked}
        className="w-full flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-cyan-200/80 hover:text-cyan-100 disabled:opacity-40"
      >
        <span>Upgrades ({upgrades.length})</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && unlocked && (
        <div className="mt-2 space-y-2">
          {upgrades.map((up) => {
            const lvl = levels[up.id] || 0;
            const next = nextUnitUpgradeLevel(up, lvl);
            const maxed = !next;
            const cost = next ? unitUpgradeCost(up, next) : {};
            const StatIcon = STAT_ICON[up.stat] || Sword;
            return (
              <div key={up.id} className="rounded-lg border border-cyan-400/15 bg-slate-900/40 p-2.5">
                <div className="flex items-center gap-2">
                  <StatIcon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <p className="font-heading text-xs tracking-wide text-white uppercase flex-1">{up.name}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">Lv {lvl}/{up.maxLevel}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{up.description}</p>
                {!maxed ? (
                  <>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => (
                        <span key={k} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/50 text-slate-200">
                          {RES_LABELS[k] || k}: <span className="text-cyan-200">{Math.floor(v).toLocaleString()}</span>
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => buy(up)}
                      disabled={busyId === up.id}
                      className="mt-2 w-full rounded-md bg-amber-500/90 hover:bg-amber-400 text-slate-900 font-heading text-[11px] tracking-wide uppercase py-1.5 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                    >
                      {busyId === up.id && <Loader2 className="w-3 h-3 animate-spin" />}
                      {busyId === up.id ? 'Purchasing…' : `Buy Level ${next}`}
                    </button>
                  </>
                ) : (
                  <div className="mt-1.5 inline-flex items-center gap-1 text-emerald-300 text-[11px] font-heading uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Maxed
                  </div>
                )}
              </div>
            );
          })}
          {error && <p className="text-[10px] text-rose-300 text-center">{error}</p>}
        </div>
      )}
    </div>
  );
}