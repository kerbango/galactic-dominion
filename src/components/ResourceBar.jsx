import React, { useState, useEffect } from 'react';
import { Gem, Layers, Zap, Coins, Pickaxe, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';

const RESOURCES = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300', glow: 'rgba(110,231,183,0.5)' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300', glow: 'rgba(203,213,225,0.4)' },
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300', glow: 'rgba(167,139,250,0.5)' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300', glow: 'rgba(252,211,77,0.5)' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300', glow: 'rgba(103,232,249,0.5)' },
];

function formatAmount(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

export default function ResourceBar() {
  const [empire, setEmpire] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
        if (active) setEmpire(empires[0] || null);
      } catch (e) {
        if (active) setEmpire(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    // Poll every 60s so the HUD picks up the hourly service-role tick, which
    // doesn't reach the realtime subscription.
    const poll = setInterval(load, 60000);
    // Live-update when any Empire record is created/updated/deleted so the
    // HUD reflects a freshly founded empire without a full page reload.
    const unsubscribe = base44.entities.Empire.subscribe((event) => {
      if (active) load();
    });
    return () => { active = false; clearInterval(poll); unsubscribe(); };
  }, []);

  // Refetch the instant the production-cycle countdown hits zero, so the HUD
  // shows freshly ticked totals without waiting for the next poll. Retries
  // until the server tick has actually landed.
  useCycleRefresh(empire?.last_tick_date || empire?.updated_date, setEmpire);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!empire) {
    return (
      <div className="glass-panel rounded-lg px-4 py-2 text-xs text-muted-foreground font-mono uppercase tracking-widest">
        No Empire Founded
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 gap-y-1 max-w-full">
      {RESOURCES.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.key} className="flex items-center gap-1.5 sm:gap-2">
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${r.color}`} style={{ filter: `drop-shadow(0 0 4px ${r.glow})` }} />
            <span className="font-mono text-xs sm:text-sm font-semibold text-foreground tabular-nums">
              {formatAmount(empire[r.key])}
            </span>
            <span className="hidden lg:inline text-[10px] uppercase tracking-widest text-muted-foreground">
              {r.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}