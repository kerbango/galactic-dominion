import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Radar, Crosshair, Flag, Crown, Navigation, AlertTriangle } from 'lucide-react';
import { GRID_SIZE, distance, travelSeconds, formatDuration, lightYears } from '@/lib/galaxy';
import FleetMarkers from '@/components/fleet/FleetMarkers';
import ActiveFleets from '@/components/fleet/ActiveFleets';
import DispatchFleet from '@/components/fleet/DispatchFleet';

export default function GalacticMap() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [fleets, setFleets] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        if (active) setUser(me);
        const res = await base44.functions.invoke('getGalacticMap', {});
        if (active) setData(res.data);
        const fleetList = await base44.entities.Fleet.list('-created_date', 200);
        if (active) setFleets(fleetList);
      } catch (e) {
        if (active) setError(e.message || 'Failed to load galactic map.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    // Live-update fleets when any Fleet record is created/updated/deleted so
    // newly dispatched fleets and arrivals appear without a manual refresh.
    const unsubscribe = base44.entities.Fleet.subscribe(() => {
      base44.entities.Fleet.list('-created_date', 200).then((f) => setFleets(f)).catch(() => {});
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  // Per-second tick drives the live countdowns and fleet position animation.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Mark the player's own fleets as arrived once their arrival time passes,
  // so finished journeys drop out of the active list. (Only the owner can
  // update; rival fleets are cleaned up by their owners.)
  useEffect(() => {
    if (!user) return;
    fleets
      .filter((f) => f.status === 'in_transit' && new Date(f.arrival_date).getTime() <= now && f.created_by_id === user.id)
      .forEach((f) => base44.entities.Fleet.update(f.id, { status: 'arrived' }));
  }, [now, fleets, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 glass-panel rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const empires = (data?.empires || []).filter((e) => e.map_x != null && e.map_y != null);
  const myEmpire = user ? empires.find((e) => e.created_by_id === user.id) : null;
  const selected = empires.find((e) => e.id === selectedId) || null;
  const inTransit = fleets.filter((f) => f.status === 'in_transit');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Radar className="w-7 h-7 text-cyan-300" />
        <div>
          <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
            Galactic Map
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
            {empireCountLabel(empires.length)} · Sector grid {GRID_SIZE}×{GRID_SIZE}
          </p>
        </div>
      </div>

      {!myEmpire && (
        <div className="glass-panel rounded-lg p-4 mb-6 flex items-center gap-3 border border-amber-400/30">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
          <p className="text-sm text-amber-100/90">
            Your empire has no coordinates yet.{' '}
            <Link to="/setup" className="underline text-cyan-300">Found an empire</Link> to claim a sector.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Map */}
        <div className="glass-panel-strong rounded-2xl p-3 md:p-4">
          <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
            <svg viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {Array.from({ length: GRID_SIZE / 100 + 1 }, (_, i) => i * 100).map((c) => (
                <g key={`g-${c}`}>
                  <line x1={c} y1={0} x2={c} y2={GRID_SIZE} stroke="rgba(120,200,230,0.08)" strokeWidth={1} />
                  <line x1={0} y1={c} x2={GRID_SIZE} y2={c} stroke="rgba(120,200,230,0.08)" strokeWidth={1} />
                </g>
              ))}
              {/* Frame */}
              <rect x={0} y={0} width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke="rgba(120,200,230,0.25)" strokeWidth={2} rx={8} />

              {/* In-transit fleets (rendered under empire markers) */}
              <FleetMarkers fleets={inTransit} now={now} myUserId={user?.id} />

              {/* Empire markers */}
              {empires.map((e) => {
                const mine = myEmpire && e.id === myEmpire.id;
                const sel = selected && e.id === selected.id;
                return (
                  <g key={e.id} onClick={() => setSelectedId(e.id)} className="cursor-pointer">
                    {mine && (
                      <circle cx={e.map_x} cy={e.map_y} r={26} fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth={2} className="animate-pulse-glow" />
                    )}
                    <circle
                      cx={e.map_x}
                      cy={e.map_y}
                      r={mine ? 9 : 6}
                      fill={mine ? 'rgba(56,189,248,0.95)' : 'rgba(167,139,250,0.85)'}
                      stroke={sel ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                      strokeWidth={sel ? 3 : 1.5}
                    />
                    <text
                      x={e.map_x}
                      y={e.map_y - 14}
                      textAnchor="middle"
                      fontSize={mine ? 20 : 15}
                      fontFamily="Orbitron, sans-serif"
                      fill={mine ? 'rgba(186,240,255,0.95)' : 'rgba(203,213,225,0.75)'}
                      style={{ pointerEvents: 'none' }}
                    >
                      {e.empire_name.length > 16 ? e.empire_name.slice(0, 15) + '…' : e.empire_name}
                    </text>
                  </g>
                );
              })}

              {/* Own coordinates readout */}
              {myEmpire && (
                <text x={12} y={GRID_SIZE - 12} fontSize={16} fontFamily="ui-monospace, monospace" fill="rgba(120,200,230,0.7)">
                  YOU @ {Math.round(myEmpire.map_x)}, {Math.round(myEmpire.map_y)}
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Side panel */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="w-4 h-4 text-cyan-300" />
            <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase">Empires</h2>
          </div>

          {selected ? (
            <EmpireDetail
              empire={selected}
              myEmpire={myEmpire}
              onClear={() => setSelectedId(null)}
            />
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '60vh' }}>
              {empires.length === 0 && (
                <p className="text-sm text-muted-foreground">No empires have claimed a sector yet.</p>
              )}
              {empires.map((e) => {
                const mine = myEmpire && e.id === myEmpire.id;
                const d = myEmpire ? distance(myEmpire, e) : null;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className="w-full text-left glass-panel rounded-lg p-3 hover:border-cyan-300/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        {mine ? <Crown className="w-4 h-4 text-cyan-300 shrink-0" /> : <Flag className="w-4 h-4 text-violet-300 shrink-0" />}
                        <span className={`truncate font-heading text-sm uppercase tracking-wide ${mine ? 'text-cyan-100' : 'text-foreground'}`}>
                          {e.empire_name}
                        </span>
                      </span>
                      {mine && <span className="text-[10px] font-mono uppercase text-cyan-300/80">You</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {Math.round(e.map_x)}, {Math.round(e.map_y)}
                      {d != null && !mine && <span className="text-cyan-300/70"> · {Math.round(lightYears(d))} Ly · {formatDuration(travelSeconds(d))}</span>}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active fleet movements */}
          {inTransit.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cyan-400/10">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-cyan-300" />
                <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase">Fleet Movements</h2>
              </div>
              <ActiveFleets fleets={fleets} now={now} myUserId={user?.id} />
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-cyan-400/10 text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> You</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" /> Rival</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Enemy fleet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmpireDetail({ empire, myEmpire, onClear }) {
  const mine = myEmpire && empire.id === myEmpire.id;
  const d = myEmpire ? distance(myEmpire, empire) : null;
  const eta = d != null ? travelSeconds(d) : null;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {mine ? <Crown className="w-5 h-5 text-cyan-300" /> : <Flag className="w-5 h-5 text-violet-300" />}
          <h3 className="font-heading text-lg tracking-wide text-white uppercase">{empire.empire_name}</h3>
        </div>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="glass-panel rounded-lg p-3 space-y-2 text-sm">
        <Row label="Ruler" value={empire.ruler_name} />
        <Row label="Sector" value={`${Math.round(empire.map_x)}, ${Math.round(empire.map_y)}`} mono />
        {!mine && d != null && (
          <>
            <Row label="Distance" value={`${Math.round(lightYears(d))} Ly`} mono />
            <div className="flex items-center gap-2 pt-2 border-t border-cyan-400/10 text-cyan-200">
              <Navigation className="w-4 h-4" />
              <span className="font-mono text-sm">Est. travel {formatDuration(eta)}</span>
            </div>
          </>
        )}
        {mine && <p className="text-xs text-cyan-300/70 pt-2 border-t border-cyan-400/10">This is your home sector.</p>}
      </div>
      {!mine && myEmpire && d != null && (
        <DispatchFleet target={empire} myEmpire={myEmpire} onDispatched={onClear} />
      )}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function empireCountLabel(n) {
  if (n === 0) return 'No empires charted';
  if (n === 1) return '1 empire charted';
  return `${n} empires charted`;
}