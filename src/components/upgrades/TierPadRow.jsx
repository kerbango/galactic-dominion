import React from 'react';

// A single tier rendered as a glass-morphism row with an LED status dot.
// status: 'owned' (green) | 'next' (amber) | 'locked' (dim).
export default function TierPadRow({ label, status }) {
  const ledClass = status === 'owned' ? 'led-green' : status === 'next' ? 'led-amber' : 'led-dim';
  return (
    <div className="rounded-md px-3 py-2.5 flex items-center gap-3 bg-white/5 border border-cyan-400/15">
      <span className={`led ${ledClass}`} />
      <p className="font-heading text-[11px] text-slate-200 flex-1 leading-tight tracking-wide uppercase">{label}</p>
      {status === 'owned' && (
        <span className="font-heading text-[9px] text-emerald-400/80 uppercase tracking-wide">Active</span>
      )}
    </div>
  );
}