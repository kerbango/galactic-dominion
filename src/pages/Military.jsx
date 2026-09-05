import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { useAuth } from '@/lib/AuthContext';
import { UNITS, isUnitUnlocked } from '@/data/units';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';
import { computePlanetDefenseRating } from '@/data/planetDefense';
import DefenseDashboard from '@/components/military/DefenseDashboard';
import ShipRoster from '@/components/military/ShipRoster';
import ShipVisualization from '@/components/military/ShipVisualization';
import ShipSpecs from '@/components/military/ShipSpecs';
import ConstructionBay from '@/components/military/ConstructionBay';
import MobileShipSelector from '@/components/military/MobileShipSelector';
import ShipRegistry from '@/components/military/ShipRegistry';
import { Loader2, Sword, Shield, Factory, Crosshair, Activity, BookOpen } from 'lucide-react';

const MILITARY_BG = "https://media.base44.com/images/public/6a8dedaa90af486a558f758e/d4a4244f4_ChatGPTImageAug28202609_39_29PM.png";
const DEPLOYED_STATUSES = new Set(['in_transit', 'in_battle', 'awaiting_recon', 'scouting']);

// Military — futuristic shipyard / fleet construction terminal. Three-zone
// desktop layout (roster · holographic inspection · technical specs) over a
// bottom construction bay; a purpose-built vertical mobile layout. All
// mechanics (construction, timers, upgrades, deployment, affordability) are
// unchanged — this is a visual/UX modernization only.
export default function Military() {
  const { empire, refresh } = useEmpire();
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [units, setUnits] = useState(null);
  const [fleets, setFleets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('shipyard');

  const loadAll = useCallback(async () => {
    try {
      const [recs, unitRecs, fleetRecs] = await Promise.all([
        base44.entities.TechProgress.list('-updated_date', 500),
        base44.entities.Unit.list('-created_date', 200),
        base44.entities.Fleet.list('-created_date', 500),
      ]);
      const map = {};
      for (const r of recs) map[r.tech_id] = r;
      setProgress(map);
      const umap = {};
      for (const u of unitRecs) umap[u.unit_type] = u;
      setUnits(umap);
      setFleets(fleetRecs);
    } catch {
      setProgress({}); setUnits({}); setFleets([]);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const unsub1 = base44.entities.TechProgress.subscribe(() => loadAll());
    const unsub2 = base44.entities.Unit.subscribe(() => loadAll());
    const unsub3 = base44.entities.Fleet.subscribe(() => loadAll());
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [loadAll]);
  useCycleRefresh(empire?.last_tick_date, loadAll);

  const finalizeBuilds = useCallback(async (updatedUnit) => {
    if (updatedUnit) {
      setUnits((current) => ({ ...current, [updatedUnit.unit_type]: updatedUnit }));
    }
    try { await base44.functions.invoke('tickMyEmpire', {}); await refresh(); } catch { /* next cycle retries */ }
    await loadAll();
  }, [loadAll, refresh]);

  const completedIds = useMemo(
    () => new Set(Object.entries(progress || {}).filter(([, r]) => r?.status === 'completed').map(([id]) => id)),
    [progress]
  );

  const filtered = useMemo(
    () => UNITS.slice().sort((a, b) => (isUnitUnlocked(a, completedIds) ? 0 : 1) - (isUnitUnlocked(b, completedIds) ? 0 : 1)),
    [completedIds]
  );

  const selectedUnit = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.find((u) => u.id === selectedId) || filtered[0];
  }, [filtered, selectedId]);

  const deployedMap = useMemo(() => {
    const m = {};
    for (const f of fleets) {
      if (f.created_by_id !== user?.id) continue;
      if (!DEPLOYED_STATUSES.has(f.status)) continue;
      const man = f.ship_manifest || {};
      for (const [k, v] of Object.entries(man)) m[k] = (m[k] || 0) + (v || 0);
    }
    return m;
  }, [fleets, user]);

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
  const selectedRecord = selectedUnit ? units[selectedUnit.id] : undefined;
  const selectedUnlocked = selectedUnit ? isUnitUnlocked(selectedUnit, completedIds) : false;

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050810] pointer-events-none">
        <img src={MILITARY_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.45) 0%, rgba(5,8,16,0.7) 60%, rgba(5,8,16,0.9) 100%)' }} />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-7 relative z-10">
        {/* Header */}
        <div className="glass-panel-strong rounded-2xl p-4 md:p-5 mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                <Sword className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="command-label">Imperial Fleet Command · Live</p>
                <h1 className="font-heading text-xl md:text-2xl tracking-[0.08em] text-white uppercase">Military Shipyard</h1>
                <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/55">Inspect · Construct · Upgrade · Deploy</p>
              </div>
            </div>
            <span className="command-status">Shipyard network online</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="glass-panel rounded-xl p-1 mb-4 flex gap-1">
          <button
            onClick={() => setActiveTab('shipyard')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-heading uppercase tracking-widest transition-all ${activeTab === 'shipyard' ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
          >
            <Factory className="w-3.5 h-3.5" /> Shipyard
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-heading uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Ship Registry
          </button>
        </div>

        {activeTab === 'registry' ? (
          <ShipRegistry completedIds={completedIds} />
        ) : (
        <>
        <div className="sticky top-2 z-10 glass-panel-strong rounded-xl px-4 py-2.5 mb-4 flex items-center gap-4">
          <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-slate-400"><Crosshair className="w-3 h-3 text-cyan-300" /> Fleet <span className="text-cyan-200">{totalOwned}</span></span>
            <span className="flex items-center gap-1.5 text-slate-400"><Factory className="w-3 h-3 text-amber-300" /> Building <span className="text-amber-300">{totalBuilding}</span></span>
            <span className="flex items-center gap-1.5 text-slate-400"><Shield className="w-3 h-3 text-emerald-300" /> Defense <span className="text-emerald-200">{defenseRating.toLocaleString()}</span></span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-400"><Activity className="w-3 h-3 text-violet-300" /> Hulls <span className="text-violet-200">{UNITS.length}</span></span>
          </div>
          <button
            onClick={finalizeBuilds}
            className="ml-auto text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md border border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/10"
          >
            Finalize Builds
          </button>
        </div>

        <DefenseDashboard empire={empire} unitRecords={Object.values(units)} />

        {/* Mobile ship selector */}
        <MobileShipSelector
          className="lg:hidden mb-3"
          units={filtered}
          unitRecords={units}
          completedIds={completedIds}
          selectedId={selectedUnit?.id}
          onSelect={setSelectedId}
        />

        {/* Three-zone shipyard grid (desktop) / stacked (mobile) */}
        <div className="grid lg:grid-cols-[280px_1fr_320px] gap-4">
          <ShipRoster
            className="hidden lg:flex"
            units={filtered}
            unitRecords={units}
            completedIds={completedIds}
            selectedId={selectedUnit?.id}
            onSelect={setSelectedId}
          />
          <ShipVisualization unit={selectedUnit} unitRecord={selectedRecord} unlocked={selectedUnlocked} />
          <ShipSpecs unit={selectedUnit} unitRecord={selectedRecord} unlocked={selectedUnlocked} />
        </div>

        {/* Construction bay */}
        {selectedUnit && (
          <ConstructionBay
            className="mt-4"
            unit={selectedUnit}
            unitRecord={selectedRecord}
            unlocked={selectedUnlocked}
            deployedCount={deployedMap[selectedUnit.id] || 0}
            onBuilt={finalizeBuilds}
          />
        )}
        </>
        )}
      </div>
    </>
  );
}