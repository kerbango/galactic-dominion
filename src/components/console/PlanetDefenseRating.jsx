import React, { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
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
    // Refresh when Unit records change (new builds, upgrades, losses).
    const unsub = base44.entities.Unit.subscribe(() => {
      base44.entities.Unit.list('-created_date', 200)
        .then((units) => setRating(computePlanetDefenseRating(empire, units)))
        .catch(() => {});
    });
    return unsub;
  }, [empire]);

  if (rating == null) return null;

  return (
    <div className="glass-panel rounded-lg p-4 flex items-center gap-4 md:w-3/5 md:mx-auto">
      <div className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-emerald-400/30 bg-emerald-400/10">
        <Shield className="w-6 h-6 text-emerald-300" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-200/70">Planet Defense Rating</p>
        <p className="font-mono text-2xl font-bold text-emerald-100 tabular-nums leading-none mt-0.5">
          {rating.toLocaleString()}
        </p>
      </div>
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 text-right max-w-[8rem] leading-tight">
        Fortifications + Garrison
      </p>
    </div>
  );
}