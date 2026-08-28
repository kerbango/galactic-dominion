import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { UNITS, isUnitUnlocked } from '@/data/units';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';
import UnitCard from '@/components/military/UnitCard';
import { Loader2, Sword } from 'lucide-react';

// Military — ship roster driven by research unlocks. Each unit type is
// gated by a tech; locked types are greyed with the required research name.
// Unlocked types can be built (timed construction) and upgraded per-type.
// Construction completions are finalized by the owner-callable tick
// (tickMyEmpire processes builds), so the roster refreshes both on the
// production-cycle rollover and when a live timer hits zero.
export default function Military() {
  const { empire, refresh } = useEmpire();
  const [progress, setProgress] = useState(null);
  const [units, setUnits] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [recs, unitRecs] = await Promise.all([
        base44.entities.TechProgress.list('-updated_date', 500),
        base44.entities.Unit.list('-created_date', 200),
      ]);
      const map = {};
      for (const r of recs) map[r.tech_id] = r;
      setProgress(map);
      const umap = {};
      for (const u of unitRecs) umap[u.unit_type] = u;
      setUnits(umap);
    } catch {
      setProgress({});
      setUnits({});
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const unsub1 = base44.entities.TechProgress.subscribe(() => { loadAll(); });
    const unsub2 = base44.entities.Unit.subscribe(() => { loadAll(); });
    return () => { unsub1(); unsub2(); };
  }, [loadAll]);
  useCycleRefresh(empire?.last_tick_date, loadAll);

  // Finalize due builds via the owner-callable tick (which now processes
  // constructions), then refresh treasury + roster. Used as the completion
  // callback when a construction timer hits zero.
  const finalizeBuilds = useCallback(async () => {
    try {
      await base44.functions.invoke('tickMyEmpire', {});
      await refresh();
    } catch { /* ignore — next cycle refresh retries */ }
    await loadAll();
  }, [loadAll, refresh]);

  const completedIds = useMemo(
    () => new Set(Object.entries(progress || {}).filter(([, r]) => r?.status === 'completed').map(([id]) => id)),
    [progress]
  );

  const sortedUnits = useMemo(() => {
    return [...UNITS].sort((a, b) => {
      const au = isUnitUnlocked(a, completedIds) ? 0 : 1;
      const bu = isUnitUnlocked(b, completedIds) ? 0 : 1;
      return au - bu;
    });
  }, [completedIds]);

  if (!progress || !units) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center mb-8">
        <Sword className="w-7 h-7 text-cyan-300 mb-2" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">Military</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">
          Construct fleets and upgrade each ship class. Research unlocks new hulls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedUnits.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            unitRecord={units[unit.id]}
            unlocked={isUnitUnlocked(unit, completedIds)}
            onBuilt={finalizeBuilds}
          />
        ))}
      </div>
    </div>
  );
}