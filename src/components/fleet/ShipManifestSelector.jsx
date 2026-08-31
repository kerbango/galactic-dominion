import React from 'react';
import { Ship, Package } from 'lucide-react';
import { UNITS, isUnitUnlocked } from '@/data/units';
import { distance, travelSeconds, formatDuration } from '@/lib/galaxy';

const SHIP_ICON = { transport: Package };

// Lists the player's actual constructed warships available for deployment.
// Each row shows the ship name, available count, attack strength, home
// garrison location, and a count selector. Selection is driven by the
// parent (manifest state) so the deployed ships are subtracted server-side
// and cannot be double-deployed while away.
export default function ShipManifestSelector({ unitRecords, completedTechs, myEmpire, target, manifest, onChange }) {
  const ships = UNITS.filter((u) => u.category !== 'ground' && u.category !== 'defense' && isUnitUnlocked(u, completedTechs));
  const available = ships.filter((u) => (unitRecords[u.id]?.owned_count || 0) > 0);
  const d = myEmpire && target ? distance(myEmpire, target) : null;
  const eta = d != null ? formatDuration(travelSeconds(d)) : '—';
  const totalSelected = Object.values(manifest).reduce((s, n) => s + (n || 0), 0);
  const totalAttack = Object.entries(manifest).reduce((s, [type, n]) => {
    const u = ships.find((x) => x.id === type);
    return s + (n || 0) * (u?.baseStats?.attack || 0);
  }, 0);

  const setCount = (id, value) => {
    const owned = unitRecords[id]?.owned_count || 0;
    const v = Math.max(0, Math.min(owned, Math.floor(Number(value) || 0)));
    onChange({ ...manifest, [id]: v });
  };

  if (available.length === 0) {
    return (
      <div className="rounded-lg border border-amber-400/30 bg-amber-950/10 p-3 text-center">
        <p className="text-[11px] text-amber-200/80 font-mono uppercase tracking-widest">No warships available</p>
        <p className="text-[10px] text-muted-foreground mt-1">Build ships on the Military screen to deploy a fleet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
        <span className="text-cyan-200/70">ETA to target</span>
        <span className="text-cyan-200">{eta}</span>
      </div>
      <div className="space-y-1.5">
        {available.map((u) => {
          const owned = unitRecords[u.id]?.owned_count || 0;
          const sel = manifest[u.id] || 0;
          const Icon = SHIP_ICON[u.category] || Ship;
          const attack = u.baseStats?.attack || 0;
          return (
            <div key={u.id} className="flex items-center gap-2 rounded-md border border-cyan-400/10 bg-slate-950/30 px-2 py-1.5">
              <Icon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-[11px] uppercase tracking-wide text-white truncate">{u.name}</p>
                <p className="text-[9px] font-mono text-slate-500">ATK {attack} · Home Garrison</p>
              </div>
              <span className="text-[9px] font-mono text-slate-400 w-14 text-right">Avail {owned}</span>
              <input
                type="number"
                min={0}
                max={owned}
                value={sel}
                onChange={(e) => setCount(u.id, e.target.value)}
                className="w-16 h-8 rounded-md bg-background/60 border border-cyan-400/20 px-1.5 font-mono text-xs text-foreground text-center focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest pt-1">
        <span className="text-slate-400">Total: <span className="text-cyan-200">{totalSelected}</span> ships</span>
        <span className="text-slate-400">Strength: <span className="text-cyan-200">{totalAttack}</span></span>
      </div>
    </div>
  );
}