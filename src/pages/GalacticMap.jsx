import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { notifyBattleResolved, notifyFleetReturned } from '@/lib/battleNotify.jsx';
import { Loader2, Radar, Crosshair, Flag, Crown, Navigation, AlertTriangle, Shield, Radio, Target, Activity } from 'lucide-react';
import { GRID_SIZE, distance, travelSeconds, formatDuration, lightYears } from '@/lib/galaxy';
import ZoomableGalaxyMap from '@/components/galaxy/ZoomableGalaxyMap';
import EmpireSearchSelect from '@/components/galaxy/EmpireSearchSelect';
import ActiveFleets from '@/components/fleet/ActiveFleets';
import PlanetaryCommand from '@/components/galaxy/PlanetaryCommand';

export default function GalacticMap() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [fleets, setFleets] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedFleetId, setSelectedFleetId] = useState(null);
  const [centerOn, setCenterOn] = useState(null);
  const handleSelectFleet = (id) => setSelectedFleetId((prev) => (prev === id ? null : id));
  const focusFleet = (fleet) => {
    setSelectedFleetId(fleet.id);
    const tx = fleet.leg === 'return' ? fleet.origin_x : fleet.target_x;
    const ty = fleet.leg === 'return' ? fleet.origin_y : fleet.target_y;
    if (tx != null && ty != null) setCenterOn({ x: tx, y: ty, key: Date.now() });
  };

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
    // Polling fallback: service-role writes (processFleets) do not reliably
    // trigger the realtime subscription, so re-fetch every 30 seconds to
    // catch battle resolutions and return arrivals the socket missed.
    const poll = setInterval(() => {
      base44.entities.Fleet.list('-created_date', 200).then((f) => setFleets(f)).catch(() => {});
    }, 30000);
    return () => {active = false;unsubscribe();clearInterval(poll);};
  }, []);

  // Per-second tick drives the live countdowns and fleet position animation.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Detect battle resolutions and fleet returns. Compares each fleet's
  // current status against the previous snapshot so transitions fire exactly
  // once. Both the realtime subscription and the 30-second polling fallback
  // feed into this same effect; the localStorage guard inside the notify
  // helpers prevents a duplicate toast if both detect the same transition.
  const prevFleetStatus = useRef({});
  useEffect(() => {
    if (!user) return;
    const prev = prevFleetStatus.current;
    const next = {};
    for (const f of fleets) {
      next[f.id] = { status: f.status, leg: f.leg, outcome: f.outcome };
      if (f.created_by_id !== user.id) continue;
      const p = prev[f.id];
      // Battle resolved: in_battle → return leg (outcome now set).
      if (p && p.status === 'in_battle' && f.status === 'in_transit' && f.leg === 'return') {
        notifyBattleResolved(f);
      }
      // Fleet returned home: return leg → arrived (loot deposited by server).
      if (p && p.leg === 'return' && p.status !== 'arrived' && f.status === 'arrived') {
        notifyFleetReturned(f);
      }
    }
    prevFleetStatus.current = next;
  }, [fleets, user]);

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
  const selectedRelationship = !selected ? null : selected.id === myEmpire?.id ? 'Sovereign Control' : fleets.some((f) => f.created_by_id === selected.created_by_id && f.target_empire_id === myEmpire?.id) ? 'Hostile Contact' : 'Unconfirmed';
  // Only show fleets the player is involved in (their own + attacks targeting
  // them) so the map isn't cluttered with hundreds of rival-vs-rival moves.
  const visibleFleets = fleets.filter((f) => {
    const isMine = f.created_by_id === user?.id;
    const targetsMe = myEmpire && f.target_empire_id === myEmpire.id;
    return isMine || targetsMe;
  });

  const inTransit = visibleFleets.filter((f) => {
    if (f.status === 'in_battle') return true;
    if (f.status === 'awaiting_recon' || f.status === 'scouting') return true;
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-7">
      <div className="glass-panel-strong rounded-2xl p-4 md:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
              <Radar className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <p className="command-label">Strategic Command Network · Live</p>
              <h1 className="font-heading text-xl md:text-2xl tracking-[0.08em] text-white uppercase">Galactic Tactical Grid</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/55">{empireCountLabel(empires.length)} · {GRID_SIZE}×{GRID_SIZE} sector theater</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2 md:border-l md:border-cyan-400/10 md:pl-5">
            <div className="rounded-lg border border-cyan-400/10 bg-slate-950/25 px-3 py-2">
              <p className="command-label">Tracked</p>
              <p className="font-mono text-sm font-bold tabular-nums">{empires.length}</p>
            </div>
            <div className="rounded-lg border border-cyan-400/10 bg-slate-950/25 px-3 py-2">
              <p className="command-label">Operations</p>
              <p className="font-mono text-sm font-bold tabular-nums">{inTransit.length}</p>
            </div>
            <span className="command-status">Sensors online</span>
          </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 lg:gap-5">
        {/* Map */}
        <ZoomableGalaxyMap
          empires={empires}
          myEmpire={myEmpire}
          fleets={inTransit}
          now={now}
          myUserId={user?.id}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          selectedFleetId={selectedFleetId}
          onSelectFleetId={handleSelectFleet}
          centerOn={centerOn}
        />

        {/* Side panel */}
        <div className="glass-panel-strong rounded-2xl p-4 flex flex-col relative overflow-hidden">
          <div className="scanline-overlay" />
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-300" />
              <div>
                <p className="command-label">Tactical Intelligence</p>
                <h2 className="font-heading text-sm tracking-[0.18em] text-cyan-100 uppercase">Sector Operations</h2>
              </div>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{empires.length} contacts</span>
          </div>

          {selected ?
          <PlanetaryCommand
            target={selected}
            myEmpire={myEmpire}
            relationship={selectedRelationship}
            scoutFleet={visibleFleets.find((f) => f.created_by_id === user?.id && f.target_empire_id === selected.id && f.mission_type === 'scout' && (f.status === 'awaiting_recon' || f.status === 'scouting'))}
            now={now}
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
                <div>
                  <p className="command-label">Fleet Control</p>
                  <h2 className="font-heading text-sm tracking-[0.18em] text-cyan-100 uppercase">Active Operations</h2>
                </div>
              </div>
              <ActiveFleets fleets={visibleFleets} now={now} myUserId={user?.id} onSelectFleet={focusFleet} />
            </div>
          }

          <div className="mt-4 pt-4 border-t border-cyan-400/10">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3.5 h-3.5 text-cyan-300/60" />
              <p className="command-label">Contact Classification</p>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-x-4 gap-y-2 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> You</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" /> Rival</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Sent</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Returning</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-flash-red" /> Attacking you</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block animate-pulse-glow" /> In Battle</span>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

function empireCountLabel(n) {
  if (n === 0) return 'No empires charted';
  if (n === 1) return '1 empire charted';
  return `${n} empires charted`;
}