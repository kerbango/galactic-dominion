import React from 'react';

const OWNERSHIP = {
  player: { accent: '#38bdf8', label: 'YOUR SYSTEM' },
  hostile: { accent: '#f87171', label: 'HOSTILE' },
  neutral: { accent: '#a78bfa', label: 'NEUTRAL' },
};

const PLANETS = [
  { light: '#67e8f9', mid: '#0e7490', dark: '#082f49', land: '#a7f3d0', atmosphere: '#22d3ee' },
  { light: '#fbbf24', mid: '#b45309', dark: '#451a03', land: '#fde68a', atmosphere: '#fb923c' },
  { light: '#c4b5fd', mid: '#6d28d9', dark: '#2e1065', land: '#ddd6fe', atmosphere: '#a78bfa' },
  { light: '#86efac', mid: '#15803d', dark: '#052e16', land: '#d9f99d', atmosphere: '#4ade80' },
  { light: '#fda4af', mid: '#be123c', dark: '#4c0519', land: '#fecdd3', atmosphere: '#fb7185' },
];

const stableIndex = (value) => {
  const text = String(value || 'system');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  return Math.abs(hash) % PLANETS.length;
};

export default function SystemMarker({ empire, mine, selected, hostile, contested, zoom, inView, onSelect }) {
  const x = empire.map_x;
  const y = empire.map_y;
  const ownership = mine ? OWNERSHIP.player : hostile ? OWNERSHIP.hostile : OWNERSHIP.neutral;
  const palette = PLANETS[stableIndex(empire.id)];
  const medium = zoom >= 2.4;
  const detailed = zoom >= 5;
  const planetR = detailed ? 13 : medium ? 10 : 7;
  const orbitX = detailed ? 25 : medium ? 20 : 14;
  const orbitY = detailed ? 12 : medium ? 9 : 6;
  const planetX = detailed ? 20 : medium ? 16 : 11;
  const starR = detailed ? 4.2 : medium ? 3.5 : 2.8;
  const markerRadius = detailed ? 39 : medium ? 32 : 24;
  const scale = 1 / zoom;
  const safeId = `system-${String(empire.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const name = empire.empire_name || 'Unknown System';
  const displayName = detailed || name.length <= 18 ? name : `${name.slice(0, 17)}…`;

  return (
    <g onClick={() => onSelect(empire.id)} style={{ cursor: 'pointer' }}>
      <defs>
        <radialGradient id={`${safeId}-planet`} cx="30%" cy="25%" r="78%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="48%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.dark} />
        </radialGradient>
        <radialGradient id={`${safeId}-star`} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
        <clipPath id={`${safeId}-clip`}>
          <circle cx={planetX} cy="0" r={planetR} />
        </clipPath>
      </defs>

      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse cx="0" cy="0" rx={orbitX} ry={orbitY} fill="none" stroke={ownership.accent} strokeWidth="1.1" opacity={medium ? 0.42 : 0.3} strokeDasharray={mine || contested ? 'none' : '3 3'} />
        {medium && <ellipse cx="0" cy="0" rx={orbitX + 7} ry={orbitY + 4} fill="none" stroke={ownership.accent} strokeWidth="0.7" opacity="0.2" transform="rotate(-18)" />}
        <circle cx="0" cy="0" r={starR * 2.2} fill="#fbbf24" opacity="0.12" className={inView ? 'animate-pulse-glow' : ''} />
        <circle cx="0" cy="0" r={starR} fill={`url(#${safeId}-star)`} stroke="#fff7cc" strokeWidth="0.7" />
        <path d={`M ${-starR - 3} 0 H ${starR + 3} M 0 ${-starR - 3} V ${starR + 3}`} stroke="#fde68a" strokeWidth="0.65" opacity="0.65" />

        <circle cx={planetX} cy="0" r={planetR + 1.7} fill="none" stroke={palette.atmosphere} strokeWidth="2.4" opacity="0.42" />
        <circle cx={planetX} cy="0" r={planetR} fill={`url(#${safeId}-planet)`} stroke="rgba(255,255,255,0.65)" strokeWidth="0.8" />
        <g clipPath={`url(#${safeId}-clip)`} opacity="0.72">
          <path d={`M ${planetX - planetR} -2 C ${planetX - 5} -8, ${planetX + 2} -7, ${planetX + planetR} -2 C ${planetX + 4} 1, ${planetX - 2} 3, ${planetX - planetR} -2 Z`} fill={palette.land} opacity="0.48" />
          <path d={`M ${planetX - planetR} 5 C ${planetX - 3} 1, ${planetX + 3} 7, ${planetX + planetR} 3 L ${planetX + planetR} ${planetR} L ${planetX - planetR} ${planetR} Z`} fill={palette.dark} opacity="0.58" />
          {detailed && <path d={`M ${planetX - 8} -8 Q ${planetX - 2} -3 ${planetX + 4} -6 T ${planetX + 12} -3`} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1.2" />}
        </g>
        <ellipse cx={planetX - planetR * 0.28} cy={-planetR * 0.34} rx={planetR * 0.3} ry={planetR * 0.18} fill="white" opacity="0.22" transform={`rotate(-25 ${planetX} 0)`} />

        <circle cx="0" cy="0" r={markerRadius} fill="none" stroke={ownership.accent} strokeWidth={mine ? 2 : 1.2} opacity={mine ? 0.72 : 0.48} strokeDasharray={mine ? 'none' : '4 5'} />
        {detailed && <path d={`M ${-markerRadius} 0 H ${-markerRadius + 6} M ${markerRadius - 6} 0 H ${markerRadius}`} stroke={ownership.accent} strokeWidth="2" />}

        {contested && (
          <g className="animate-flash-red">
            <circle cx="0" cy="0" r={markerRadius + 7} fill="none" stroke="#fb923c" strokeWidth="2.4" strokeDasharray="5 4" />
            <path d={`M 0 ${-markerRadius - 12} l -4 7 h 8 Z`} fill="#fb923c" />
          </g>
        )}

        {selected && (
          <>
            <circle cx="0" cy="0" r={markerRadius + 11} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="7 5" className="animate-system-spin" />
            <circle cx="0" cy="0" r={markerRadius + 5} fill="none" stroke={ownership.accent} strokeWidth="2" opacity="0.9" className="animate-pulse-glow" />
            {[[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([sx, sy], index) => {
              const bx = sx * (markerRadius + 15);
              const by = sy * (markerRadius + 15);
              return <path key={index} d={`M ${bx - sx * 9} ${by} H ${bx} V ${by - sy * 9}`} fill="none" stroke="#ffffff" strokeWidth="2.5" />;
            })}
          </>
        )}

        {(zoom >= 1.35 || selected) && (
          <g transform={`translate(0 ${-markerRadius - (selected ? 23 : 13)})`} style={{ pointerEvents: 'none' }}>
            {selected && <rect x={-Math.max(36, displayName.length * 4.5)} y="-10" width={Math.max(72, displayName.length * 9)} height="20" rx="3" fill="rgba(2,6,23,0.88)" stroke={ownership.accent} strokeWidth="1" />}
            <text textAnchor="middle" dominantBaseline="central" fontSize={selected ? 11 : detailed ? 9 : 8} fontFamily="Orbitron, sans-serif" fontWeight={selected ? 700 : 500} fill={selected ? '#ffffff' : '#dbeafe'}>{displayName}</text>
            {detailed && <text y="12" textAnchor="middle" fontSize="5.5" fontFamily="ui-monospace, monospace" fill={ownership.accent} letterSpacing="1.2">{ownership.label}</text>}
          </g>
        )}

        <circle cx="0" cy="0" r={markerRadius + 14} fill="transparent" />
      </g>
    </g>
  );
}