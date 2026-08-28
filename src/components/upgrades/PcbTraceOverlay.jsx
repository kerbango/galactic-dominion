import React from 'react';

// Decorative cyan PCB traces routed orthogonally behind the upgrade grid.
// Purely presentational — sits behind the panels (z-0) so cards render on
// top and the traces read as weaving through the gaps. Right-angle paths
// with glowing node dots at junctions evoke a single circuit board.
export default function PcbTraceOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="pcb-trace-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        filter="url(#pcb-trace-glow)"
        stroke="#00d4ff"
        strokeWidth="1.1"
        fill="none"
        opacity="0.45"
      >
        <path d="M0,38 H78 V18 H200" />
        <path d="M0,100 H58 V122 H142 V100 H200" />
        <path d="M0,162 H100 V140 H200" />
        <path d="M100,0 V38" />
        <path d="M100,162 V200" />
        <path d="M20,100 V162" />
        <path d="M180,38 V100" />
      </g>
      <g fill="#00d4ff" opacity="0.7">
        <circle cx="78" cy="38" r="2.2" />
        <circle cx="58" cy="122" r="2.2" />
        <circle cx="142" cy="100" r="2.2" />
        <circle cx="100" cy="140" r="2.2" />
        <circle cx="100" cy="38" r="2.2" />
        <circle cx="20" cy="162" r="2.2" />
        <circle cx="180" cy="100" r="2.2" />
      </g>
    </svg>
  );
}