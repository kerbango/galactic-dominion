import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Radar, Crosshair, Flag, Crown, Navigation, AlertTriangle } from 'lucide-react';
import { GRID_SIZE, distance, travelSeconds, formatDuration, lightYears } from '@/lib/galaxy';
import ZoomableGalaxyMap from '@/components/galaxy/ZoomableGalaxyMap';
import EmpireSearchSelect from '@/components/galaxy/EmpireSearchSelect';
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
    return () => {active = false;unsubscribe();};
  }, []);

  // Per-second tick drives the live countdowns and fleet position animation.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Arrivals are resolved by the server-side processFleets tick (combat +
  // return leg + loot deposit), which runs even with no client open. The
  // client no longer auto-marks fleets arrived, since that would skip combat
  // and strand the fleet at the target.

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>);

  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 glass-panel rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-destructive">{error}</p>
      </div>);

  }

  const empires = (data?.empires || []).filter((e) => e.map_x != null && e.map_y != null);
  const myEmpire = user ? empires.find((e) => e.created_by_id === user.id) : null;
  const selected = empires.find((e) => e.id === selectedId) || null;
  // Only show fleets the player is involved in (their own + attacks targeting
  // them) so the map isn't cluttered with hundreds of rival-vs-rival moves.
  const visibleFleets = fleets.filter((f) => {
    const isMine = f.created_by_id === user?.id;
    const targetsMe = myEmpire && f.target_empire_id === myEmpire.id;
    return isMine || targetsMe;
  });

  const inTransit = visibleFleets.filter((f) => {
    if (f.status === 'in_battle') return true;
    if (f.status !== 'in_transit') return false;
    // Drop return-leg fleets the instant their return trip completes so they
    // leave the operations box without waiting for the server tick (service-
    // role writes don't reach the realtime subscription).
    if (f.leg === 'return' && f.return_arrival_date) {
      return new Date(f.return_arrival_date).getTime() > now;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col items-center text-center gap-1 mb-6">
        <Radar className="w-7 h-7 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Galactic Map
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
          {empireCountLabel(empires.length)} · Sector grid {GRID_SIZE}×{GRID_SIZE}
        </p>
      </div>

      {!myEmpire &&
      <div className="glass-panel rounded-lg p-4 mb-6 flex items-center gap-3 border border-amber-400/30">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
          <p className="text-sm text-amber-100/90">
            Your empire has no coordinates yet.{' '}
            <Link to="/setup" className="underline text-cyan-300">Found an empire</Link> to claim a sector.
          </p>
        </div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Map */}
        <ZoomableGalaxyMap
          empires={empires}
          myEmpire={myEmpire}
          fleets={inTransit}
          now={now}
          myUserId={user?.id}
          selectedId={selectedId}
          onSelectId={setSelectedId}
        />

        {/* Side panel */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="w-4 h-4 text-cyan-300" />
            <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase">Empires</h2>
          </div>

          {selected ?
          <EmpireDetail
            empire={selected}
            myEmpire={myEmpire}
            onClear={() => setSelectedId(null)} /> :


empires.length === 0 ? (
            <p className="text-sm text-muted-foreground">No empires have claimed a sector yet.</p>
          ) : (
            <EmpireSearchSelect empires={empires} myEmpire={myEmpire} onSelectId={setSelectedId} />
          )
          }

          {/* Active fleet movements */}
          {inTransit.length > 0 &&
          <div className="mt-4 pt-4 border-t border-cyan-400/10">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-cyan-300" />
                <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase">oPERATIONS</h2>
              </div>
              <ActiveFleets fleets={visibleFleets} now={now} myUserId={user?.id} />
            </div>
          }

          <div className="mt-4 pt-4 border-t border-cyan-400/10 text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> You</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" /> Rival</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Sent</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Returning</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-flash-red" /> Attacking you</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block animate-pulse-glow" /> In Battle</span>
          </div>
        </div>
      </div>
    </div>);

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
        {!mine && d != null &&
        <>
            <Row label="Distance" value={`${Math.round(lightYears(d))} Ly`} mono />
            <div className="flex items-center gap-2 pt-2 border-t border-cyan-400/10 text-cyan-200">
              <Navigation className="w-4 h-4" />
              <span className="font-mono text-sm">Est. travel {formatDuration(eta)}</span>
            </div>
          </>
        }
        {mine && <p className="text-xs text-cyan-300/70 pt-2 border-t border-cyan-400/10">This is your home sector.</p>}
      </div>
      {!mine && myEmpire && d != null &&
      <DispatchFleet target={empire} myEmpire={myEmpire} onDispatched={onClear} />
      }
    </div>);

}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>);

}

function empireCountLabel(n) {
  if (n === 0) return 'No empires charted';
  if (n === 1) return '1 empire charted';
  return `${n} empires charted`;
}