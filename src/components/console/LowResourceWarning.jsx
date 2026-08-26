import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { productionPerHour } from '@/lib/production';
import { Gem, Layers, Zap, Coins, Pickaxe, AlertTriangle } from 'lucide-react';

const RESOURCES = [
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
];

// A resource is "running low" when its balance falls below half an hour of
// production output (floored at 50), so the warning threshold scales with the
// player's economy and tech level rather than a flat number.
const LOW_FRACTION = 0.5;
const LOW_FLOOR = 50;

export default function LowResourceWarning({ empire }) {
  const [rates, setRates] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const completed = await base44.entities.TechProgress.filter({
          created_by_id: user.id,
          status: 'completed',
        });
        if (active) setRates(productionPerHour(completed));
      } catch {
        if (active) setRates(null);
      }
    };
    load();
  }, []);

  if (!rates || !empire) return null;

  const lowResources = RESOURCES.filter((r) => {
    const balance = empire[r.key] || 0;
    const threshold = Math.max(LOW_FLOOR, (rates[r.key] || 0) * LOW_FRACTION);
    return balance < threshold;
  });

  if (lowResources.length === 0) return null;

  return (
    <div className="md:w-3/5 md:mx-auto mt-2">
      <div className="glass-panel rounded-md p-2 border border-amber-400/40 animate-pulse-glow">
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <p className="text-[0.6rem] font-mono uppercase tracking-widest text-amber-200">
            Low Reserves
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lowResources.map((r) => {
            const Icon = r.icon;
            const balance = Math.floor(empire[r.key] || 0);
            const threshold = Math.max(LOW_FLOOR, (rates[r.key] || 0) * LOW_FRACTION);
            return (
              <div
                key={r.key}
                className="flex items-center gap-1.5 rounded bg-amber-400/10 border border-amber-400/30 px-2 py-1"
              >
                <Icon className={`w-3 h-3 ${r.color}`} />
                <span className="text-[0.6rem] font-mono uppercase tracking-widest text-amber-100">
                  {r.label}
                </span>
                <span className="text-[0.6rem] font-mono text-amber-300/80 tabular-nums">
                  {`${balance.toLocaleString()} < ${Math.floor(threshold)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}