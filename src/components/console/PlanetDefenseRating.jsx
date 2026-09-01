import React, { useState, useEffect } from 'react';
import { Shield, LockKeyhole } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { computePlanetDefenseRating } from '@/data/planetDefense';
import { useEmpire } from '@/lib/EmpireContext';

// Displays the player's Planet Defense Rating — derived from defensive
// structures and garrisoned ground troops — so the value of building
// fortifications and keeping troops at home is immediately visible.
export default function PlanetDefenseRating() {
  const { empire } = useEmpire();
  const [rating, setRating] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!empire) return;
      try {
        const units = await base44.entities.Unit.list('-created_date', 200);
        setRating(computePlanetDefenseRating(empire, units));
      } catch {
        setRating(null);
      }
    };
    load();
    const unsub = base44.entities.Unit.subscribe(() => {
      base44.entities.Unit.list('-created_date', 200)
        .then((units) => setRating(computePlanetDefenseRating(empire, units)))
        .catch(() => {});
    });
    return unsub;
  }, [empire]);

  if (rating == null) return null;

  return (
    <div className="glass-panel-strong rounded-xl p-4 h-full">
      <div className="flex items-start gap-3">
        <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-emerald-400/30 bg-emerald-400/10">
          <Shield className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="command-label">Planetary Security</p>
            <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-300/70">Secure</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">Defense rating</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="font-mono text-3xl font-bold text-emerald-100 tabular-nums leading-none">{rating.toLocaleString()}</p>
            <p className="text-[9px] font-mono text-muted-foreground pb-0.5 uppercase">Fortifications + Garrison</p>
          </div>
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-slate-900 overflow-hidden border border-emerald-400/10">
        <div className="h-full bg-emerald-400/70" style={{ width: `${Math.min(100, Math.max(8, rating / 10))}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
        <span>Homeworld defense grid</span>
        <span className="flex items-center gap-1 text-emerald-300/70"><LockKeyhole className="w-3 h-3" /> Active</span>
      </div>
    </div>
  );
}