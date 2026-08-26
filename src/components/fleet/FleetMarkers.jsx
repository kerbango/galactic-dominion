import React from 'react';
import { fleetPosition } from '@/lib/galaxy';

// Renders in-transit fleets as moving dots on the SVG map. Color encodes
// mission state:
//   - Owned outbound (sent) fleets  → purple
//   - Owned returning fleets       → blue
//   - Rival fleets attacking me     → flashing red dot
//   - Other rival fleets            → neutral slate
// `myEmpireId` identifies the player's empire so we can detect rival fleets
// whose target is the player. fleetPosition handles both legs of the round
// trip. A small amber dot marks fleets carrying loot home.
export default function FleetMarkers({ fleets, now, myUserId, myEmpireId }) {
  if (!fleets?.length) return null;
  return (
    <g>
      {fleets.map((f) => {
        const pos = fleetPosition(f, now);
        const mine = f.created_by_id === myUserId;
        const attackingMe = !mine && f.target_empire_id === myEmpireId;

        let color;
        let lineColor;
        let flashClass = '';
        if (attackingMe) {
          color = 'rgba(244,63,94,0.95)';
          lineColor = 'rgba(244,63,94,0.3)';
          flashClass = 'animate-flash-red';
        } else if (mine && f.leg === 'return') {
          color = 'rgba(96,165,250,0.95)';
          lineColor = 'rgba(96,165,250,0.18)';
        } else if (mine) {
          color = 'rgba(192,132,252,0.95)';
          lineColor = 'rgba(192,132,252,0.18)';
        } else {
          color = 'rgba(148,163,184,0.8)';
          lineColor = 'rgba(148,163,184,0.14)';
        }

        const hasLoot = f.leg === 'return' && f.loot && (
          (f.loot.aetherium_crystal || 0) + (f.loot.ferrite_titanium || 0) +
          (f.loot.energy || 0) + (f.loot.vrind || 0)
        ) > 0;

        return (
          <g key={f.id}>
            <line
              x1={f.origin_x}
              y1={f.origin_y}
              x2={f.target_x}
              y2={f.target_y}
              stroke={lineColor}
              strokeWidth={1.5}
              strokeDasharray="6 6"
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={5}
              fill={color}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
              className={flashClass}
            />
            {hasLoot && (
              <circle
                cx={pos.x + 7}
                cy={pos.y - 7}
                r={2.5}
                fill="rgba(251,191,36,0.95)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={1}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}