import React from 'react';

const COLORS = {
  friendly: { core: 'rgba(56,189,248,1)', glow: 'rgba(56,189,248,0.5)', ring: 'rgba(56,189,248,0.6)', name: 'rgba(186,240,255,0.95)' },
  hostile:  { core: 'rgba(248,113,113,1)', glow: 'rgba(248,113,113,0.5)', ring: 'rgba(248,113,113,0.6)', name: 'rgba(254,202,202,0.95)' },
  neutral:  { core: 'rgba(167,139,250,1)', glow: 'rgba(167,139,250,0.45)', ring: 'rgba(167,139,250,0.55)', name: 'rgba(203,213,225,0.8)' },
};

// One star system on the galactic map. Marker sizes scale by 1/zoom so they
// keep a constant on-screen footprint (always visible & clickable), while
// detail (orbital ring + orbiting satellite) only renders when zoomed in,
// giving a cleaner strategic view when zoomed out. Ownership is encoded by
// color (friendly=cyan, hostile=red, neutral=violet); contested systems flash
// an orange warning ring; selected systems get a pulsing ring + rotating
// targeting brackets. Only in-view systems animate, for performance.
export default function SystemMarker({ empire, mine, selected, hostile, contested, zoom, inView, onSelect }) {
  const x = empire.map_x;
  const y = empire.map_y;
  const profile = mine ? COLORS.friendly : hostile ? COLORS.hostile : COLORS.neutral;
  const detailed = zoom >= 3;
  const showName = zoom >= 1.5;
  const active = inView;

  const bodyR = 26 / zoom;
  const haloR = 43 / zoom;
  const ringR = 69 / zoom;
  const hitR = 62 / zoom;
  const fontSize = Math.max(7, Math.min(56, 50 / zoom));

  const name = empire.empire_name || '';
  const displayName = zoom >= 3
    ? (name.length > 16 ? name.slice(0, 15) + '…' : name)
    : (name.length > 12 ? name.slice(0, 11) + '…' : name);

  return (
    <g onClick={() => onSelect(empire.id)} style={{ cursor: 'pointer' }}>
      {/* orbital ring (zoomed in) */}
      {detailed && (
        <circle cx={x} cy={y} r={ringR} fill="none" stroke={profile.ring} strokeWidth={1.2} opacity={0.55} />
      )}
      {/* orbiting satellite — subtle planetary activity (in-view only) */}
      {detailed && active && (
        <g>
          <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="16s" repeatCount="indefinite" />
          <circle cx={x + ringR} cy={y} r={7 / zoom} fill={profile.core} opacity={0.9} />
        </g>
      )}
      {/* contested warning ring (system under active combat) */}
      {contested && (
        <circle cx={x} cy={y} r={haloR + 12 / zoom} fill="none" stroke="rgba(251,113,60,0.85)" strokeWidth={2} strokeDasharray="5 5" className="animate-flash-red" />
      )}
      {/* hostile pulsing warning ring */}
      {hostile && !contested && (
        <circle cx={x} cy={y} r={haloR + 10 / zoom} fill="none" stroke="rgba(248,113,113,0.7)" strokeWidth={1.5} className="animate-pulse-glow" />
      )}
      {/* selection effect — pulsing ring + rotating targeting brackets */}
      {selected && (
        <>
          <circle cx={x} cy={y} r={haloR + 16 / zoom} fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth={2} strokeDasharray="6 5" className="animate-pulse-glow" />
          <g>
            <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="7s" repeatCount="indefinite" />
            {[[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([sx, sy], i) => {
              const bx = x + sx * (haloR + 24 / zoom);
              const by = y + sy * (haloR + 24 / zoom);
              const u = 7 / zoom;
              return (
                <g key={i} stroke="rgba(255,255,255,0.9)" strokeWidth={2} fill="none" strokeLinecap="round">
                  <line x1={bx} y1={by} x2={bx - sx * u} y2={by} />
                  <line x1={bx} y1={by} x2={bx} y2={by - sy * u} />
                </g>
              );
            })}
          </g>
        </>
      )}
      {/* halo glow (subtle pulse for in-view systems) */}
      <circle cx={x} cy={y} r={haloR} fill={profile.glow} opacity={active ? 0.2 : 0.14} className={active ? 'animate-pulse-glow' : ''} />
      {/* planet body */}
      <circle cx={x} cy={y} r={bodyR} fill={profile.core} stroke={selected ? '#ffffff' : 'rgba(255,255,255,0.5)'} strokeWidth={selected ? 2.5 / zoom : 1.2 / zoom} />
      <circle cx={x} cy={y} r={bodyR * 0.38} fill="rgba(255,255,255,0.85)" />
      {/* name (zoom-gated, abbreviated when zoomed out) */}
      {showName && (
        <text x={x} y={y - haloR - 6 / zoom} textAnchor="middle" fontSize={fontSize} fontFamily="Orbitron, sans-serif" fill={profile.name} style={{ pointerEvents: 'none' }}>
          {displayName}
        </text>
      )}
      {/* transparent hit area */}
      <circle cx={x} cy={y} r={hitR} fill="transparent" />
    </g>
  );
}