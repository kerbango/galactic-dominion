import React from 'react';
import { Rocket, Navigation } from 'lucide-react';
import { fleetProgress, remainingSeconds, formatDuration } from '@/lib/galaxy';

// Lists all in-transit fleets with live countdowns and progress bars.
// `now` (epoch ms) drives the per-second countdown and progress fill. Each
// row labels which leg (Outbound/Return) the fleet is on and shows the
// combat outcome once the return leg has started.
export default function ActiveFleets({ fleets, now, myUserId }) {
  const active = (fleets || []).filter((f) => f.status === 'in_transit');
  if (!active.length) return null;
  return (
    <div className="space-y-2">
      {active.map((f) => {
        const mine = f.created_by_id === myUserId;
        const returning = f.leg === 'return';
        const p = fleetProgress(f, now);
        const remaining = remainingSeconds(f, now);
        const lootTotal = f.loot
          ? (f.loot.aetherium_crystal || 0) + (f.loot.ferrite_titanium || 0) +
            (f.loot.energy || 0) + (f.loot.vrind || 0)
          : 0;
        return (
          <div key={f.id} className="glass-panel rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                <Rocket className={`w-4 h-4 shrink-0 ${mine ? 'text-cyan-300' : 'text-rose-300'}`} />
                <span className="truncate font-heading text-xs uppercase tracking-wide text-foreground">
                  {returning ? `${f.target_empire_name} → ${f.origin_empire_name}` : `${f.origin_empire_name} → ${f.target_empire_name}`}
                </span>
              </span>
              <span className={`text-[10px] font-mono uppercase ${mine ? 'text-cyan-300/80' : 'text-rose-300/80'}`}>
                {mine ? 'Yours' : 'Incoming'}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full ${mine ? 'bg-cyan-400' : 'bg-rose-400'}`}
                style={{ width: `${Math.round(p * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs font-mono">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{returning ? (f.survivors ?? f.fleet_size) : f.fleet_size} ships</span>
                <span className={`uppercase tracking-widest ${returning ? 'text-violet-300/80' : 'text-cyan-300/70'}`}>
                  {returning ? 'Return' : 'Outbound'}
                </span>
              </span>
              <span className="flex items-center gap-1 text-cyan-200">
                <Navigation className="w-3 h-3" />
                {remaining > 0 ? formatDuration(remaining) : 'Arriving'}
              </span>
            </div>
            {returning && f.outcome && (
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                <span className={f.outcome === 'win' ? 'text-emerald-300' : 'text-rose-300'}>
                  {f.outcome === 'win' ? 'Victory' : 'Defeat'}
                </span>
                <span className="text-muted-foreground">· {f.survivors} survivors</span>
                {f.outcome === 'win' && lootTotal > 0 && (
                  <span className="text-amber-300">· loot {lootTotal.toLocaleString()}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}