import React from 'react';
import { Rocket, Navigation, Swords, ArrowRight, ArrowLeft } from 'lucide-react';
import { fleetProgress, remainingSeconds, formatDuration, battleProgress, battleRemainingSeconds, reconProgress, reconRemainingSeconds } from '@/lib/galaxy';

const SCOUT_LABEL = { light: 'Light Scout', medium: 'Medium Scout', heavy: 'Heavy Scout' };

// Lists all active fleets with live countdowns and progress bars. Each card
// leads with the fleet name, then a prominent destination line (arrow +
// system name, or ← HOME for returning fleets, or ⚔ for active battles) so
// the destination is immediately obvious. `now` (epoch ms) drives the
// per-second countdown and progress fill.
export default function ActiveFleets({ fleets, now, myUserId, onSelectFleet }) {
  const active = (fleets || []).filter((f) => {
    if (f.status === 'in_battle') return true;
    if (f.status === 'awaiting_recon' || f.status === 'scouting') return true;
    if (f.status !== 'in_transit') return false;
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
        const isScanning = f.status === 'awaiting_recon' || f.status === 'scouting';
        const activeScan = f.status === 'scouting';
        const returning = f.leg === 'return';
        const p = inBattle ? battleProgress(f, now) : isScanning && activeScan ? reconProgress(f, now) : isScanning ? 0 : fleetProgress(f, now);
        const remaining = inBattle ? battleRemainingSeconds(f, now) : activeScan ? reconRemainingSeconds(f, now) : remainingSeconds(f, now);
        const lootTotal = f.loot
          ? (f.loot.aetherium_crystal || 0) + (f.loot.ferrite_titanium || 0) +
            (f.loot.energy || 0) + (f.loot.vrind || 0)
          : 0;

        const fleetName = f.mission_type === 'scout' ? (SCOUT_LABEL[f.scout_class] || 'Scout') : (f.origin_empire_name || 'Fleet');
        const destLabel = returning ? `HOME: ${f.origin_empire_name || 'Home'}` : (f.target_empire_name || 'Unknown');
        const DestIcon = inBattle ? Swords : returning ? ArrowLeft : ArrowRight;
        const destColor = inBattle ? 'text-orange-300' : returning ? 'text-violet-300' : mine ? 'text-cyan-300' : 'text-rose-300';
        const destRouteColor = inBattle ? 'text-orange-200' : returning ? 'text-violet-200' : mine ? 'text-cyan-200' : 'text-rose-200';

        const ledClass = inBattle ? 'led-amber' : isScanning ? 'led-green' : returning ? 'led-green' : mine ? 'led-green' : 'led-amber';
        const barColor = inBattle ? 'bg-orange-400' : isScanning ? 'bg-cyan-400' : mine ? 'bg-cyan-400' : 'bg-rose-400';
        const barGlow = inBattle ? 'shadow-[0_0_8px_rgba(251,146,60,0.6)]' : isScanning ? 'shadow-[0_0_8px_rgba(56,189,248,0.6)]' : mine ? 'shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'shadow-[0_0_8px_rgba(244,63,94,0.6)]';
        return (
          <div key={f.id} className={`glass-panel rounded-xl p-3 relative overflow-hidden ${inBattle ? 'border border-orange-400/45 bg-orange-950/10' : returning ? 'border border-violet-400/15' : 'border border-cyan-400/10'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className={`led ${ledClass}`} />
                <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Fleet telemetry</span>
              </span>
              <span className={`text-[10px] font-mono uppercase ${inBattle ? 'text-orange-300/90' : mine ? 'text-cyan-300/80' : 'text-rose-300/80'}`}>
                {inBattle ? 'In Battle' : mine ? 'Yours' : 'Incoming'}
              </span>
            </div>

            {/* Fleet name (origin / scout class) */}
            <p className="mt-1 font-heading text-xs uppercase tracking-wide text-foreground truncate">
              {fleetName}
            </p>

            {/* Destination — prominent, clickable to focus the map */}
            <button
              type="button"
              onClick={() => onSelectFleet?.(f)}
              className="mt-0.5 flex items-center gap-1.5 w-full text-left group focus:outline-none"
            >
              <DestIcon className={`w-4 h-4 shrink-0 ${destColor} ${inBattle ? 'animate-pulse-glow' : ''}`} />
              <span className={`font-heading text-sm uppercase tracking-wide truncate group-hover:underline ${destRouteColor}`}>
                {destLabel}
              </span>
            </button>

            <div className="mt-2 h-1.5 rounded-full bg-secondary/80 overflow-hidden border border-white/5">
              <div
                className={`h-full ${barColor} ${barGlow} transition-all duration-500`}
                style={{ width: `${Math.round(p * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{returning ? (f.survivors ?? f.fleet_size) : f.fleet_size} ships</span>
                <span className={`uppercase tracking-widest ${inBattle ? 'text-orange-300/80' : isScanning ? 'text-cyan-300/80' : returning ? 'text-violet-300/80' : 'text-cyan-300/70'}`}>
                  {inBattle ? 'Battle' : activeScan ? 'Scanning' : isScanning ? 'Recon Ready' : returning ? 'Return' : 'Outbound'}
                </span>
              </span>
              <span className={`flex items-center gap-1 ${inBattle ? 'text-orange-200' : 'text-cyan-200'}`}>
                {inBattle ? <Swords className="w-3 h-3" /> : <Navigation className="w-3 h-3" />}
                {remaining > 0 ? formatDuration(remaining) : inBattle ? 'Resolving' : activeScan ? 'Completing' : isScanning ? 'Ready' : 'Arriving'}
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
            {returning && f.ground_outcome && (
              <div className="mt-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                <span className={f.ground_outcome === 'win' ? 'text-emerald-300' : 'text-rose-300'}>
                  Ground {f.ground_outcome === 'win' ? 'Captured' : 'Repelled'}
                </span>
                {f.ground_survivors && Object.keys(f.ground_survivors).length > 0 && (
                  <span className="text-muted-foreground">
                    · {Object.values(f.ground_survivors).reduce((s, n) => s + (n || 0), 0)} ground surv
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}