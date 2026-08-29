import React, { useState, useEffect } from 'react';
import { Rocket, Loader2, Package, Footprints, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { UNITS, isUnitUnlocked } from '@/data/units';

// Inline dispatch control shown for a rival empire. Creates a fleet record
// via the dispatchFleet backend function. In addition to the ship count, the
// player can expand a ground-forces section to load ground units into Troop
// Transports (up to total transport capacity). Loaded units are subtracted
// from the planet's garrison/defense pool server-side.
export default function DispatchFleet({ target, myEmpire, onDispatched }) {
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unitRecords, setUnitRecords] = useState({});
  const [completedTechs, setCompletedTechs] = useState(new Set());
  const [groundOpen, setGroundOpen] = useState(false);
  const [groundSelection, setGroundSelection] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [units, techs] = await Promise.all([
          base44.entities.Unit.list('-created_date', 200),
          base44.entities.TechProgress.list('-updated_date', 500),
        ]);
        const umap = {};
        for (const u of units) umap[u.unit_type] = u;
        setUnitRecords(umap);
        setCompletedTechs(new Set(techs.filter((t) => t.status === 'completed').map((t) => t.tech_id)));
      } catch { /* ignore — ground section just stays collapsed */ }
    };
    load();
  }, []);

  const transportUnit = UNITS.find((u) => u.id === 'troop_transport');
  const transportUnlocked = isUnitUnlocked(transportUnit, completedTechs);
  const transportOwned = unitRecords['troop_transport']?.owned_count || 0;
  const totalCapacity = transportOwned * (transportUnit?.carryingCapacity || 0);

  const groundUnits = UNITS.filter((u) => u.category === 'ground' && isUnitUnlocked(u, completedTechs));

  const totalLoaded = Object.values(groundSelection).reduce((s, n) => s + (n || 0), 0);
  const overCapacity = totalLoaded > totalCapacity;
  const hasGround = totalLoaded > 0;
  const noTransports = hasGround && transportOwned < 1;

  const handleGroundChange = (unitType, value) => {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    const owned = unitRecords[unitType]?.owned_count || 0;
    setGroundSelection((prev) => ({ ...prev, [unitType]: Math.min(v, owned) }));
  };

  const handle = async () => {
    setError('');
    setLoading(true);
    try {
      const ground_forces = {};
      for (const [k, v] of Object.entries(groundSelection)) {
        if (v > 0) ground_forces[k] = v;
      }
      await base44.functions.invoke('dispatchFleet', {
        target_empire_id: target.id,
        fleet_size: size,
        ground_forces,
      });
      onDispatched?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to dispatch fleet.');
    } finally {
      setLoading(false);
    }
  };

  const canDispatch = !loading && !overCapacity && !noTransports;

  return (
    <div className="pt-3 border-t border-cyan-400/10 space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Ships</label>
        <input
          type="number"
          min={1}
          max={9999}
          value={size}
          onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 h-9 rounded-md bg-background/60 border border-cyan-400/20 px-2 font-mono text-sm text-foreground"
        />
      </div>

      {/* Ground forces collapsible */}
      {transportUnlocked && groundUnits.length > 0 && (
        <div className="rounded-lg border border-cyan-400/15 overflow-hidden">
          <button
            type="button"
            onClick={() => setGroundOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-200">
              <Footprints className="w-3.5 h-3.5" />
              Ground Forces
              {hasGround && <span className="text-amber-300 font-mono normal-case">({totalLoaded})</span>}
            </span>
            {groundOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {groundOpen && (
            <div className="p-3 space-y-2.5 bg-slate-950/30">
              {/* Transport capacity readout */}
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-amber-200">
                  <Package className="w-3 h-3" />
                  Transport Cap
                </span>
                <span className={overCapacity ? 'text-rose-300' : 'text-slate-200'}>
                  {totalLoaded} / {totalCapacity}
                </span>
              </div>
              {transportOwned < 1 && (
                <p className="text-[10px] text-rose-300/80 text-center">
                  Build a Troop Transport to carry ground forces.
                </p>
              )}

              {/* Ground unit rows */}
              <div className="space-y-1.5">
                {groundUnits.map((u) => {
                  const owned = unitRecords[u.id]?.owned_count || 0;
                  const sel = groundSelection[u.id] || 0;
                  const remaining = owned - sel;
                  return (
                    <div key={u.id} className="flex items-center gap-2">
                      <span className="flex-1 text-[11px] text-slate-200 truncate">{u.name}</span>
                      <span className="text-[9px] font-mono text-slate-500 w-16 text-right">
                        Garr: <span className={remaining < owned ? 'text-amber-300' : 'text-slate-300'}>{remaining}</span>/{owned}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={owned}
                        value={sel}
                        onChange={(e) => handleGroundChange(u.id, e.target.value)}
                        className="w-16 h-8 rounded-md bg-background/60 border border-cyan-400/20 px-1.5 font-mono text-xs text-foreground text-center"
                      />
                    </div>
                  );
                })}
              </div>
              {overCapacity && (
                <p className="text-[10px] text-rose-300 text-center">
                  Capacity exceeded — build more transports or unload units.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="button"
        onClick={handle}
        disabled={!canDispatch}
        className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md glass-panel-strong hover:border-cyan-300/60 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 text-cyan-300" />}
        <span className="font-heading text-sm tracking-widest text-white uppercase">
          {loading ? 'Dispatching...' : 'Dispatch Fleet'}
        </span>
      </button>
    </div>
  );
}