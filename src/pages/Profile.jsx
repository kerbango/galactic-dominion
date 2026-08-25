import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Crown, Flag, Gem, Layers, Zap, Coins, Loader2, MapPin, Radar } from 'lucide-react';
import ProductionTimer from '@/components/profile/ProductionTimer';

const RESOURCES = [
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
  { key: 'vrind', label: 'VRIND', icon: Coins, color: 'text-cyan-300' },
];

function formatAmount(n) {
  if (n == null) return '0';
  return Math.floor(n).toLocaleString();
}

export default function Profile() {
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
    return () => { active = false; };
  }, []);

  // Refresh the empire when the hourly tick (or any update) lands, so the
  // production timers reset their cycle from the new updated_date.
  useEffect(() => {
    const unsubscribe = base44.entities.Empire.subscribe((event) => {
      if (event.type === 'update' && event.data) {
        setEmpire((prev) => (prev && prev.id === event.data.id ? { ...prev, ...event.data } : prev));
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (!empire) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
      {/* Empire header card */}
      <div className="glass-panel-strong rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 border border-cyan-400/30 shrink-0">
            <Crown className="w-10 h-10 text-cyan-300" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-xs tracking-[0.3em] text-cyan-300/70 uppercase mb-1">Empire</p>
            <h1 className="font-heading text-3xl md:text-4xl tracking-wide text-white neon-text uppercase">
              {empire.empire_name}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
              <Flag className="w-4 h-4 text-cyan-300/70" />
              <span className="font-body">Ruler <span className="text-cyan-100 font-semibold">{empire.ruler_name}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <MapPin className="w-4 h-4 text-cyan-300/70" />
            {empire.map_x != null && empire.map_y != null
              ? `Sector ${Math.round(empire.map_x)}, ${Math.round(empire.map_y)}`
              : 'Unplaced'}
          </div>
        </div>
      </div>

      {/* Resources grid */}
      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-4">Treasury</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {RESOURCES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="glass-panel rounded-xl p-5">
              <Icon className={`w-6 h-6 ${r.color} mb-3`} />
              <p className="font-mono text-2xl font-bold text-foreground tabular-nums">
                {formatAmount(empire[r.key])}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{r.label}</p>
            </div>
          );
        })}
      </div>

      {/* Production — resources gained per hour from controlled planets */}
      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mt-10 mb-4">Production Cycles</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {RESOURCES.map((r) => (
          <ProductionTimer key={r.key} resource={r} lastTick={empire.updated_date} />
        ))}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/map" className="inline-flex items-center gap-2 px-6 py-3 rounded-md glass-panel-strong hover:border-cyan-300/60 transition-all">
          <Radar className="w-5 h-5 text-cyan-300" />
          <span className="font-heading text-sm tracking-widest text-white uppercase">Open Galactic Map</span>
        </Link>
      </div>
    </div>
  );
}