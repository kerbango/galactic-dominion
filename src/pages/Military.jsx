import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { UNITS, isUnitUnlocked } from '@/data/units';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';
import UnitRosterRow from '@/components/military/UnitRosterRow';
import UnitDetailPanel from '@/components/military/UnitDetailPanel';
import ClassFilter from '@/components/military/ClassFilter';
import { unitClass, UNIT_CLASSES } from '@/lib/unitClasses';
import { computePlanetDefenseRating } from '@/data/planetDefense';
import DefenseDashboard from '@/components/military/DefenseDashboard';
import { Loader2, Sword, Shield, Radio, Factory, Crosshair, Activity } from 'lucide-react';

const MILITARY_BG = "https://media.base44.com/images/public/6a8dedaa90af486a558f758e/d4a4244f4_ChatGPTImageAug28202609_39_29PM.png";

// Military — fleet command console. A master-detail layout: a class filter
// + scrollable roster rail on the left, a single detail panel (stats, build
// cost, build/timer, upgrades) on the right. One screen holds the whole
// roster; the rail scrolls internally, the page doesn't grow. Construction
// completions are finalized by the owner-callable tick (tickMyEmpire), so
// the roster refreshes on the production-cycle rollover and when a live
// timer hits zero.
export default function Military() {
  const { empire, refresh } = useEmpire();
  const [progress, setProgress] = useState(null);
  const [units, setUnits] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeClass, setActiveClass] = useState('All');
  const [query, setQuery] = useState('');

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

  const counts = useMemo(() => {
    const c = { All: UNITS.length };
    for (const cls of UNIT_CLASSES) if (cls !== 'All') c[cls] = 0;
    for (const u of UNITS) {
      const cls = unitClass(u);
      c[cls] = (c[cls] || 0) + 1;
    }
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNITS.filter((u) => {
      if (activeClass !== 'All' && unitClass(u) !== activeClass) return false;
      if (q && !u.name.toLowerCase().includes(q) && !u.id.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      const au = isUnitUnlocked(a, completedIds) ? 0 : 1;
      const bu = isUnitUnlocked(b, completedIds) ? 0 : 1;
      return au - bu;
    });
  }, [activeClass, query, completedIds]);

  const selectedUnit = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.find((u) => u.id === selectedId) || filtered[0];
  }, [filtered, selectedId]);

  if (!progress || !units) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  const totalOwned = Object.values(units).reduce((s, u) => s + (u.owned_count || 0), 0);
  const totalBuilding = Object.values(units).filter((u) => u.construction_start_date).length;
  const defenseRating = empire ? computePlanetDefenseRating(empire, Object.values(units)) : 0;

  return (
    <>
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050810] pointer-events-none">
      <img src={MILITARY_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.45) 0%, rgba(5,8,16,0.7) 60%, rgba(5,8,16,0.9) 100%)' }} />
    </div>
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 md:py-7 relative z-10">
      <div className="glass-panel-strong rounded-2xl p-4 md:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
              <Sword className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <p className="command-label">Imperial Fleet Command · Live</p>
              <h1 className="font-heading text-xl md:text-2xl tracking-[0.08em] text-white uppercase">Military Operations</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/55">Construct · Upgrade · Organize · Deploy</p>
            </div>
          </div>
          <span className="command-status">Shipyard network online</span>
        </div>
      </div>

      {/* Sticky command bar */}
      <div className="sticky top-2 z-10 glass-panel-strong rounded-xl px-4 py-2.5 mb-4 flex items-center gap-4">
        <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-slate-400"><Crosshair className="w-3 h-3 text-cyan-300" /> Fleet <span className="text-cyan-200">{totalOwned}</span></span>
          <span className="flex items-center gap-1.5 text-slate-400"><Factory className="w-3 h-3 text-amber-300" /> Building <span className="text-amber-300">{totalBuilding}</span></span>
          <span className="flex items-center gap-1.5 text-slate-400"><Shield className="w-3 h-3 text-emerald-300" /> Defense <span className="text-emerald-200">{defenseRating.toLocaleString()}</span></span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400"><Activity className="w-3 h-3 text-violet-300" /> Classes <span className="text-violet-200">{UNITS.length}</span></span>
        </div>
        <button
          onClick={finalizeBuilds}
          className="ml-auto text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md border border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/10"
        >
          Finalize Builds
        </button>
      </div>

      <DefenseDashboard empire={empire} unitRecords={Object.values(units)} />

      <div className="flex items-center gap-2 mb-2 px-1">
        <Radio className="w-3.5 h-3.5 text-cyan-300/60" />
        <p className="command-label">Fleet Registry · Select a hull to access tactical specifications</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Left rail */}
        <div className="glass-panel-strong rounded-2xl p-3 flex flex-col">
          <ClassFilter active={activeClass} onActive={setActiveClass} query={query} onQuery={setQuery} counts={counts} />
          <div className="mt-3 space-y-1 overflow-y-auto max-h-[60vh] pr-1">
            {filtered.length === 0 ? (
              <p className="text-center text-[11px] text-slate-500 py-6">No ships match.</p>
            ) : filtered.map((unit) => (
              <UnitRosterRow
                key={unit.id}
                unit={unit}
                unitRecord={units[unit.id]}
                unlocked={isUnitUnlocked(unit, completedIds)}
                selected={selectedUnit?.id === unit.id}
                onClick={() => setSelectedId(unit.id)}
              />
            ))}
          </div>
        </div>

        {/* Right detail */}
        <div>
          {selectedUnit ? (
            <UnitDetailPanel
              unit={selectedUnit}
              unitRecord={units[selectedUnit.id]}
              unlocked={isUnitUnlocked(selectedUnit, completedIds)}
              onBuilt={finalizeBuilds}
            />
          ) : (
            <div className="glass-panel rounded-2xl p-10 text-center text-slate-500 text-sm">
              Select a ship from the roster.
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}