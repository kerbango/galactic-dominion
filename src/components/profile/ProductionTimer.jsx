import React, { useState, useEffect } from 'react';

// One resource-production cycle = 60 minutes (tickResources runs hourly,
// granting +1 of every resource). This box visualises progress toward the
// next +1: a bar that fills over the hour and a live countdown.
const INTERVAL_MS = 60 * 60 * 1000;

export default function ProductionTimer({ resource, lastTick }) {
  const { icon: Icon, label, color } = resource;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const lastMs = lastTick ? new Date(lastTick).getTime() : 0;
  const elapsed = lastMs ? Math.max(0, now - lastMs) : 0;
  const progress = Math.min(1, elapsed / INTERVAL_MS);
  const remaining = Math.max(0, INTERVAL_MS - elapsed);
  const remM = Math.floor(remaining / 60000);
  const remS = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="glass-panel rounded-lg p-2.5">
      <Icon className={`w-3 h-3 ${color} mb-1.5`} />
      <p className="font-mono text-sm font-bold text-foreground tabular-nums">+1/hr</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
      <div className="mt-1.5 h-1 rounded-full bg-cyan-400/10 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-1 text-[8px] font-mono uppercase tracking-widest text-cyan-300/70">
        Next +1 in {remM}m {remS}s
      </p>
    </div>
  );
}