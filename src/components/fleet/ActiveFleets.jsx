import React from 'react';
import { Rocket, Navigation, Swords } from 'lucide-react';
import { fleetProgress, remainingSeconds, formatDuration, battleProgress, battleRemainingSeconds } from '@/lib/galaxy';

// Lists all active fleets with live countdowns and progress bars.
// `now` (epoch ms) drives the per-second countdown and progress fill. A fleet
// can be in one of three active phases:
//   - in_transit + outbound → travelling to the target (Outbound)
//   - in_battle             → fighting at the target (In Battle) with a
//                              countdown to combat resolution
//   - in_transit + return   → travelling home with survivors/loot (Return)
export default function ActiveFleets({ fleets, now, myUserId }) {
  const active = (fleets || []).filter((f) => {
    if (f.status === 'in_battle') return true;
    if (f.status !== 'in_transit') return false;
    // Remove return-leg fleets once their return trip has elapsed.
    if (f.leg === 'return' && f.return_arrival_date) {
      return new Date(f.return_arrival_date).getTime() > now;
    }
    return true;
  });
  if (!active.length) return null;
  return (
    <div className="space-y-2">
      {active.map((f) => {
        const mine = f.created_by_id === myUserId;
        const inBattle = f.status === 'in_battle';
        const returning = f.leg === 'return';
        const p = inBattle ? battleProgress(f, now) : fleetProgress(f, now);
        const remaining = inBattle ? battleRemainingSeconds(f, now) : remainingSeconds(f, now);
        const lootTotal = f.loot
          ? (f.loot.aetherium_crystal || 0) + (f.loot.ferrite_titanium || 0) +
            (f.loot.energy || 0) + (f.loot.vrind || 0)
          : 0;
        const route = `${f.origin_empire_name} → ${f.target_empire_name}`;
        return (
          <div key={f.id} className={`glass-panel rounded-lg p-3 ${inBattle ? 'border border-orange-400/40' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                {inBattle ? (
                  <Swords className="w-4 h-4 shrink-0 text-orange-300 animate-pulse-glow" />
                ) : (
                  <Rocket className={`w-4 h-4 shrink-0 ${mine ? 'text-cyan-300' : 'text-rose-300'}`} />
                )}
                <span className="truncate font-heading text-xs uppercase tracking-wide text-foreground">
                  {route}
                </span>
              </span>
              <span className={`text-[10px] font-mono uppercase ${inBattle ? 'text-orange-300/90' : mine ? 'text-cyan-300/80' : 'text-rose-300/80'}`}>
                {inBattle ? 'In Battle' : mine ? 'Yours' : 'Incoming'}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full ${inBattle ? 'bg-orange-400' : mine ? 'bg-cyan-400' : 'bg-rose-400'}`}
                style={{ width: `${Math.round(p * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs font-mono">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{returning ? (f.survivors ?? f.fleet_size) : f.fleet_size} ships</span>
                <span className={`uppercase tracking-widest ${inBattle ? 'text-orange-300/80' : returning ? 'text-violet-300/80' : 'text-cyan-300/70'}`}>
                  {inBattle ? 'Battle' : returning ? 'Return' : 'Outbound'}
                </span>
              </span>
              <span className={`flex items-center gap-1 ${inBattle ? 'text-orange-200' : 'text-cyan-200'}`}>
                {inBattle ? <Swords className="w-3 h-3" /> : <Navigation className="w-3 h-3" />}
                {remaining > 0 ? formatDuration(remaining) : inBattle ? 'Resolving' : 'Arriving'}
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