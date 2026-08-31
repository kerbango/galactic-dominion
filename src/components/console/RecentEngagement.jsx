import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Swords, ShieldCheck, ShieldX, Loader2, ArrowRight } from 'lucide-react';
import { computeSurvivorMap } from '@/lib/battleNotify.jsx';
import { formatDistanceToNow } from 'date-fns';

const RES_LABELS = {
  berentium: 'Berentium',
  ferrite_titanium: 'Ferrite',
  aetherium_crystal: 'Aetherium',
  energy: 'Energy',
  vrind: 'VRIND',
};

// Compact card for the Console showing the player's most recently resolved
// fleet engagement. Reads from the existing Fleet records — no separate
// combat-history database. Shows an empty state when the player has never
// fought a battle.
export default function RecentEngagement() {
  const [fleet, setFleet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const all = await base44.entities.Fleet.filter(
          { created_by_id: user.id },
          '-updated_date',
          50
        );
        const resolved = all.filter((f) => f.outcome);
        if (active) setFleet(resolved[0] || null);
      } catch {
        if (active) setFleet(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!fleet) {
    return (
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-3.5 h-3.5 text-cyan-300/70" />
          <h2 className="command-label">Recent Engagement</h2>
        </div>
        <p className="text-sm text-muted-foreground">No combat engagements recorded.</p>
      </div>
    );
  }

  const win = fleet.outcome === 'win';
  const survivorMap = computeSurvivorMap(fleet);
  const totalSurvivors = Object.values(survivorMap).reduce((s, n) => s + n, 0);
  const totalLosses = Object.values(fleet.ship_losses || {}).reduce((s, n) => s + (n || 0), 0);
  const lootLines = Object.entries(fleet.loot || {})
    .filter(([k, n]) => RES_LABELS[k] && n > 0)
    .map(([k, n]) => `+${n.toLocaleString()} ${RES_LABELS[k]}`);
  const date = fleet.return_departure_date || fleet.return_arrival_date || fleet.arrival_date;

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-3.5 h-3.5 text-cyan-300/70" />
          <h2 className="command-label">Recent Engagement</h2>
        </div>
        {date && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border ${
            win
              ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300'
              : 'bg-rose-400/10 border-rose-400/30 text-rose-300'
          }`}
        >
          {win ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-heading text-sm uppercase tracking-wide ${win ? 'text-emerald-300' : 'text-rose-300'}`}>
            {win ? 'Victory' : 'Defeat'}
          </p>
          <p className="text-xs text-cyan-100/80 truncate">{fleet.target_empire_name || 'Unknown'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
        <div className="rounded-lg bg-rose-400/5 border border-rose-400/15 px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-widest text-rose-300/60">Lost</p>
          <p className="text-rose-200">{totalLosses} ships</p>
        </div>
        <div className="rounded-lg bg-emerald-400/5 border border-emerald-400/15 px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-widest text-emerald-300/60">Survived</p>
          <p className="text-emerald-200">{totalSurvivors || fleet.survivors || 0} ships</p>
        </div>
      </div>
      {lootLines.length > 0 && (
        <div className="mt-3">
          <p className="text-[9px] uppercase tracking-widest text-amber-300/60 mb-1">Loot</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {lootLines.map((l) => (
              <span key={l} className="text-xs text-amber-200">{l}</span>
            ))}
          </div>
        </div>
      )}
      <Link
        to="/profile"
        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-cyan-300 hover:text-cyan-100 transition-colors"
      >
        View Combat Log <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}