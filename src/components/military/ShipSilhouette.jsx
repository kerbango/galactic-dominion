import React from 'react';

// Tasteful SVG silhouettes used when no artwork asset is registered for a
// ship in shipArt.js. One shape per broad class family; the variant is
// derived from the unit's class. In wireframe mode the silhouette renders as
// a blueprint line drawing (stroke only) with measurement annotations — this
// is a vector rendering of the same shape, not a fabricated asset.

function Light() {
  return (
    <g>
      <path d="M130,70 L215,52 L240,70 L215,88 Z" />
      <path d="M130,70 L85,60 L60,70 L85,80 Z" />
      <path d="M155,55 L185,38 L195,55 Z" />
      <path d="M155,85 L185,102 L195,85 Z" />
      <circle cx="172" cy="70" r="3" />
    </g>
  );
}
function Medium() {
  return (
    <g>
      <path d="M115,70 L225,58 L245,70 L225,82 L115,70 Z" />
      <path d="M140,55 L195,42 L200,60 Z" />
      <path d="M140,85 L195,98 L200,80 Z" />
      <rect x="165" y="62" width="22" height="16" rx="2" />
      <circle cx="212" cy="70" r="2.5" />
    </g>
  );
}
function Heavy() {
  return (
    <g>
      <path d="M85,70 L235,52 L255,70 L235,88 L85,70 Z" />
      <rect x="135" y="44" width="60" height="10" rx="3" />
      <rect x="135" y="86" width="60" height="10" rx="3" />
      <rect x="170" y="58" width="30" height="24" rx="3" />
      <rect x="200" y="64" width="30" height="12" rx="2" />
    </g>
  );
}
function Support() {
  return (
    <g>
      <rect x="90" y="52" width="150" height="36" rx="8" />
      <rect x="120" y="40" width="50" height="14" rx="4" />
      <circle cx="205" cy="70" r="10" />
      <circle cx="205" cy="70" r="3" />
    </g>
  );
}
function Ground() {
  return (
    <g>
      <rect x="95" y="50" width="90" height="40" rx="8" />
      <rect x="80" y="42" width="22" height="16" rx="3" />
      <rect x="110" y="90" width="12" height="28" />
      <rect x="160" y="90" width="12" height="28" />
      <rect x="180" y="58" width="30" height="8" rx="2" />
      <circle cx="100" cy="50" r="4" />
    </g>
  );
}
function Defense() {
  return (
    <g>
      <path d="M95,88 Q130,48 165,88 Z" />
      <rect x="90" y="88" width="80" height="12" rx="2" />
      <rect x="125" y="40" width="10" height="20" />
      <rect x="118" y="30" width="24" height="12" rx="3" />
      <circle cx="130" cy="70" r="3" />
    </g>
  );
}

const VARIANTS = { light: Light, medium: Medium, heavy: Heavy, support: Support, ground: Ground, defense: Defense };

export const SILHOUETTE_VARIANT = {
  Scouts: 'light', Explorers: 'light',
  Frigates: 'medium', Destroyers: 'medium',
  Cruisers: 'heavy', Carriers: 'heavy', Capital: 'heavy',
  Support: 'support', Transport: 'support',
  'Ground Forces': 'ground', Defense: 'defense',
};

export default function ShipSilhouette({ variant = 'medium', wireframe = false, className = '' }) {
  const Shape = VARIANTS[variant] || Medium;
  const fill = wireframe ? 'none' : 'url(#shipSilhouetteGrad)';
  const stroke = wireframe ? '#22d3ee' : 'rgba(125,211,252,0.5)';
  const sw = wireframe ? 1.4 : 1;
  return (
    <svg viewBox="0 0 260 140" className={className} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id="shipSilhouetteGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.85)" />
          <stop offset="100%" stopColor="rgba(129,140,248,0.5)" />
        </linearGradient>
      </defs>
      <Shape />
      {wireframe && (
        <g stroke="rgba(34,211,238,0.4)" strokeWidth="0.6" fill="none">
          <line x1="40" y1="20" x2="220" y2="20" />
          <line x1="40" y1="20" x2="40" y2="26" />
          <line x1="220" y1="20" x2="220" y2="26" />
          <line x1="40" y1="120" x2="220" y2="120" />
          <line x1="40" y1="114" x2="40" y2="120" />
          <line x1="220" y1="114" x2="220" y2="120" />
        </g>
      )}
    </svg>
  );
}