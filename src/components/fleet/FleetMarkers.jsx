import React from 'react';
import { fleetPosition } from '@/lib/galaxy';

// Renders in-transit fleets as moving dots on the SVG map. `fleets` is the
// list of in-transit fleet records; `now` is the current epoch ms; `myUserId`
// colors owned fleets cyan and rival fleets rose. `scale` sizes the markers
// relative to the grid so they stay visible on the larger map.
export default function FleetMarkers({ fleets, now, myUserId, scale = 1 }) {
  if (!fleets?.length) return null;
  return (
    <g>
      {fleets.map((f) => {
        const pos = fleetPosition(f, now);
        const mine = f.created_by_id === myUserId;
        const color = mine ? 'rgba(56,189,248,0.95)' : 'rgba(244,114,182,0.9)';
        return (
          <g key={f.id}>
            <line
              x1={f.origin_x}
              y1={f.origin_y}
              x2={f.target_x}
              y2={f.target_y}
              stroke={mine ? 'rgba(56,189,248,0.18)' : 'rgba(244,114,182,0.16)'}
              strokeWidth={1.5 * scale}
              strokeDasharray={`${6 * scale} ${6 * scale}`}
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={5 * scale}
              fill={color}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5 * scale}
            />
          </g>
        );
      })}
    </g>
  );
}