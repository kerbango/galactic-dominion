import React from 'react';
import { fleetPosition, fleetProgress } from '@/lib/galaxy';

// Visual profile per fleet state. Each state gets a distinct hue AND a
// distinct animation/pattern treatment so state is readable without color.
const PROFILES = {
  outbound:  { color: 'rgba(56,189,248,1)',  soft: 'rgba(56,189,248,0.28)',  trail: 'rgba(56,189,248,0.6)'  },
  returning: { color: 'rgba(167,139,250,1)', soft: 'rgba(167,139,250,0.28)', trail: 'rgba(167,139,250,0.6)' },
  hostile:   { color: 'rgba(248,113,113,1)', soft: 'rgba(248,113,113,0.3)',  trail: 'rgba(248,113,113,0.6)' },
  neutral:   { color: 'rgba(148,163,184,0.85)', soft: 'rgba(148,163,184,0.18)', trail: 'rgba(148,163,184,0.4)' },
  battle:    { color: 'rgba(251,146,60,1)',  soft: 'rgba(251,146,60,0.3)',  trail: 'rgba(251,146,60,0.5)'  },
  scanning:  { color: 'rgba(56,189,248,1)',  soft: 'rgba(56,189,248,0.3)',  trail: 'rgba(56,189,248,0.5)'  },
};

// Single fleet rendered as: full planned route (faint dashed, flowing toward
// destination) + traveled trail (origin -> current position) + moving ship
// contact (arrow pointing toward destination) + destination ring. Battle
// fleets replace this with a rotating-bracket combat marker at the target.
// `selected` brightens and enlarges this fleet's route/contact/destination;
// `anySelected` dims the non-selected fleets so the selected one stands out.
export default function FleetMarker({ fleet: f, now, zoom, myUserId, myEmpireId, selected, anySelected, onSelect }) {
  const pos = fleetPosition(f, now);
  const visualScale = 1 / Math.pow(Math.max(1, zoom || 1), 0.65);
  const mine = f.created_by_id === myUserId;
  const attackingMe = !mine && f.target_empire_id === myEmpireId;
  const inBattle = f.status === 'in_battle';
  const isScanning = f.status === 'awaiting_recon' || f.status === 'scouting';
  const returning = f.leg === 'return';

  const profile = inBattle ? PROFILES.battle
    : isScanning ? PROFILES.scanning
    : attackingMe ? PROFILES.hostile
    : mine && returning ? PROFILES.returning
    : mine ? PROFILES.outbound
    : PROFILES.neutral;

  // Active-leg endpoints. For the return leg the fleet travels target -> home.
  const fromX = returning ? f.target_x : f.origin_x;
  const fromY = returning ? f.target_y : f.origin_y;
  const toX = returning ? f.origin_x : f.target_x;
  const toY = returning ? f.origin_y : f.target_y;
  const angle = (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;

  const hasLoot = returning && f.loot && (
    (f.loot.aetherium_crystal || 0) + (f.loot.ferrite_titanium || 0) +
    (f.loot.energy || 0) + (f.loot.vrind || 0)
  ) > 0;

  const opacity = selected ? 1 : anySelected ? 0.28 : 0.85;
  const handle = (e) => { e.stopPropagation(); onSelect(f.id); };

  if (isScanning) {
    const active = f.status === 'scouting';
    const r = (selected ? 28 : 24) * visualScale;
    return (
      <g opacity={opacity} style={{ cursor: 'pointer' }} onClick={handle}>
        {/* dim full route behind the scanning contact */}
        <line x1={f.origin_x} y1={f.origin_y} x2={f.target_x} y2={f.target_y}
          stroke={profile.soft} strokeWidth={selected ? 2.5 : 1.5} vectorEffect="non-scaling-stroke"
          strokeDasharray="3 7" className="animate-dash-flow"
          opacity={selected ? 0.7 : 0.3} />
        {/* outer pulsing ring */}
        <circle cx={pos.x} cy={pos.y} r={r} fill="none"
          stroke="rgba(56,189,248,0.45)" strokeWidth={2} vectorEffect="non-scaling-stroke"
          className="animate-pulse-glow" />
        {/* radar sweep — rotating when actively scanning */}
        {active && (
          <g>
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`}
              dur="3s" repeatCount="indefinite" />
            <line x1={pos.x} y1={pos.y} x2={pos.x + r} y2={pos.y}
              stroke="rgba(56,189,248,0.7)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <circle cx={pos.x} cy={pos.y} r={r} fill="none"
              stroke="rgba(56,189,248,0.15)" strokeWidth={1} vectorEffect="non-scaling-stroke"
              strokeDasharray="4 6" />
          </g>
        )}
        {/* scout contact at target */}
        <circle cx={pos.x} cy={pos.y} r={(selected ? 9 : 7) * visualScale} fill={profile.color}
          stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <circle cx={pos.x} cy={pos.y} r={3 * visualScale} fill="rgba(255,255,255,0.95)" />
        {/* transparent hit area */}
        <circle cx={pos.x} cy={pos.y} r={30 * visualScale} fill="transparent" />
      </g>
    );
  }

  if (inBattle) {
    return (
      <g opacity={opacity} style={{ cursor: 'pointer' }} onClick={handle}>
        {/* dim full route behind the combat contact */}
        <line x1={f.origin_x} y1={f.origin_y} x2={f.target_x} y2={f.target_y}
          stroke={profile.soft} strokeWidth={selected ? 2.5 : 1.5} vectorEffect="non-scaling-stroke"
          strokeDasharray="3 7" className="animate-dash-flow"
          opacity={selected ? 0.9 : 0.45} />
        {/* warning ring */}
        <circle cx={pos.x} cy={pos.y} r={(selected ? 30 : 26) * visualScale} fill="none"
          stroke="rgba(251,146,60,0.55)" strokeWidth={2} vectorEffect="non-scaling-stroke" className="animate-pulse-glow" />
        <circle cx={pos.x} cy={pos.y} r={(selected ? 22 : 19) * visualScale} fill="rgba(251,146,60,0.12)"
          stroke={profile.soft} strokeWidth={1} />
        {/* rotating targeting brackets */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`}
            dur="4s" repeatCount="indefinite" />
          {[[15, -15], [15, 15], [-15, 15], [-15, -15]].map(([dx, dy], i) => {
            const x = pos.x + dx * visualScale, y = pos.y + dy * visualScale;
            const h = (dx > 0 ? -7 : 7) * visualScale;
            const v = (dy > 0 ? -7 : 7) * visualScale;
            return (
              <g key={i} stroke="rgba(251,146,60,0.95)" strokeWidth={2} fill="none" strokeLinecap="round">
                <line x1={x} y1={y} x2={x + h} y2={y} />
                <line x1={x} y1={y} x2={x} y2={y + v} />
              </g>
            );
          })}
        </g>
        {/* pulsing core */}
        <circle cx={pos.x} cy={pos.y} r={(selected ? 9 : 7) * visualScale} fill={profile.color}
          stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="animate-pulse-glow" />
        <circle cx={pos.x} cy={pos.y} r={3 * visualScale} fill="rgba(255,255,255,0.95)" />
        {/* transparent hit area */}
        <circle cx={pos.x} cy={pos.y} r={30 * visualScale} fill="transparent" />
      </g>
    );
  }

  return (
    <g opacity={opacity} style={{ cursor: 'pointer' }} onClick={handle}>
      {/* full planned route — faint dashed, flowing toward destination */}
      <line x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={profile.soft} strokeWidth={selected ? 2.2 : 1.2} vectorEffect="non-scaling-stroke"
        strokeDasharray="5 9" className="animate-dash-flow"
        opacity={selected ? 0.95 : 0.5} />
      {/* traveled trail — origin -> current position */}
      <line x1={fromX} y1={fromY} x2={pos.x} y2={pos.y}
        stroke={profile.trail} strokeWidth={selected ? 3.2 : 2} vectorEffect="non-scaling-stroke"
        opacity={selected ? 0.95 : 0.7} />
      {/* destination marker */}
      <circle cx={toX} cy={toY} r={(selected ? 9 : 5) * visualScale} fill="none"
        stroke={profile.color} strokeWidth={selected ? 2 : 1} vectorEffect="non-scaling-stroke"
        opacity={selected ? 0.95 : 0.5}
        className={selected ? 'animate-pulse-glow' : ''} />
      {selected && (
        <circle cx={toX} cy={toY} r={15 * visualScale} fill="none" stroke={profile.color}
          strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeDasharray="3 4" opacity={0.7} />
      )}
      {/* moving ship contact — arrow pointing toward destination */}
      <g transform={`translate(${pos.x} ${pos.y}) rotate(${angle}) scale(${visualScale})`}>
        <circle r={selected ? 10 : 7} fill={profile.color} opacity={0.18} />
        <circle r={selected ? 6 : 4.5} fill="none" stroke={profile.color}
          strokeWidth={1} opacity={0.9} />
        <path d={selected ? 'M 7 0 L -5 4.5 L -2 0 L -5 -4.5 Z' : 'M 5.5 0 L -3.5 3.5 L -1.5 0 L -3.5 -3.5 Z'}
          fill={profile.color} stroke="rgba(255,255,255,0.7)" strokeWidth={0.8} />
      </g>
      {/* loot indicator */}
      {hasLoot && (
        <circle cx={pos.x + 8 * visualScale} cy={pos.y - 8 * visualScale} r={2.5 * visualScale}
          fill="rgba(251,191,36,0.95)" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
      )}
      {/* transparent hit area */}
      <circle cx={pos.x} cy={pos.y} r={20 * visualScale} fill="transparent" />
    </g>
  );
}