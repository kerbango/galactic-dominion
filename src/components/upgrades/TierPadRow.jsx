import React from 'react';

// A single tier rendered as a PCB solder pad with an LED status dot.
// status: 'owned' (green) | 'next' (amber) | 'locked' (dim).
export default function TierPadRow({ label, status }) {
  const ledClass = status === 'owned' ? 'led-green' : status === 'next' ? 'led-amber' : 'led-dim';
  return (
    <div className="pcb-pad rounded-md px-3 py-2.5 flex items-center gap-3">
      <span className={`led ${ledClass}`} />
      <p className="pcb-silkscreen text-[11px] text-[#e0e0e0] flex-1 leading-tight">{label}</p>
      {status === 'owned' && (
        <span className="pcb-silkscreen text-[9px] text-emerald-400/80">Active</span>
      )}
    </div>
  );
}