import React, { useEffect, useRef, useState } from 'react';
import { Handshake, Loader2, Radar, Rocket, ScanSearch, ShieldCheck, Satellite, X, Crosshair, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { reconProgress, reconRemainingSeconds, formatDuration, lightYears, distance } from '@/lib/galaxy';
import { toastSuccess } from '@/lib/toasts';
import DispatchFleet from '@/components/fleet/DispatchFleet';
import IntelligencePanel from './IntelligencePanel';
import ScoutDispatch from './ScoutDispatch';
import ComingSoonPanel from './ComingSoonPanel';
import CommandSection from './CommandSection';

const LEVEL = { none: 'UNKNOWN / UNCONFIRMED', light: 'LIGHT SCOUT', medium: 'MEDIUM SCOUT', heavy: 'HEAVY SCOUT' };
const LEVEL_COLOR = { none: 'text-slate-400', light: 'text-cyan-300', medium: 'text-cyan-200', heavy: 'text-emerald-300' };

// Relative time for staleness indication: "14m ago", "3h ago", "2d ago".
// Falls back to a locale date for older entries. Uses the existing
// last_scouted_date on the PlanetaryIntelligence record — no new database
// field or expiration system.
function formatStale(dateStr) {
  const then = new Date(dateStr).getTime();
  if (!then) return 'Never';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Operation button with clear AVAILABLE / UNAVAILABLE visual states.
function OpButton({ active, available, label, Icon, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={!available}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 transition-all ${
        active ? 'border border-cyan-300/70 bg-cyan-400/15 shadow-[0_0_14px_rgba(56,189,248,0.2)]'
        : primary && available ? 'command-btn'
        : 'border border-slate-600/25 bg-slate-950/30'
      } ${!available ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <Icon className="h-4 w-4" />
      <span className="font-heading text-[10px] tracking-wider">{label}</span>
      {!available && <span className="text-[8px] font-mono uppercase text-amber-300/60">SOON</span>}
    </button>
  );
}

export default function PlanetaryCommand({ target, myEmpire, relationship, scoutFleet, now, onClear }) {
  const [intel, setIntel] = useState(null);
  const [mode, setMode] = useState(null);
  const [reconBusy, setReconBusy] = useState(false);
  const completingRef = useRef(false);

  const load = () => base44.functions.invoke('getPlanetaryIntelligence', { target_empire_id: target.id }).then((r) => { setIntel(r.data); return r.data; });
  useEffect(() => {
    setIntel(null); setMode(null); completingRef.current = false;
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [target.id]);

  // When the recon scan timer elapses, trigger completion server-side.
  useEffect(() => {
    if (!scoutFleet || scoutFleet.status !== 'scouting') return;
    const end = new Date(scoutFleet.recon_end_date).getTime();
    if (end > now) return;
    if (completingRef.current) return;
    completingRef.current = true;
    base44.functions.invoke('completeRecon', { fleet_id: scoutFleet.id })
      .then(() => load())
      .then((intelData) => {
        const lvl = intelData?.intelligence_level;
        toastSuccess('RECONNAISSANCE COMPLETE', `${intelData?.system_name || target.empire_name} · ${lvl || 'updated'} intelligence`);
      })
      .catch(() => { completingRef.current = false; });
  }, [scoutFleet?.id, scoutFleet?.status, now]);

  const conductRecon = async () => {
    if (!scoutFleet) return;
    setReconBusy(true);
    try { await base44.functions.invoke('conductRecon', { fleet_id: scoutFleet.id }); }
    catch { /* realtime will refresh */ }
    finally { setReconBusy(false); }
  };

  if (!intel) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div>;

  const mine = target.id === myEmpire?.id;
  const dist = myEmpire ? distance(myEmpire, target) : null;
  const ly = dist ? lightYears(dist) : null;

  const showReconPanel = scoutFleet && (scoutFleet.status === 'awaiting_recon' || scoutFleet.status === 'scouting');
  const scanning = scoutFleet?.status === 'scouting';
  const reconRemaining = scanning ? reconRemainingSeconds(scoutFleet, now) : 0;
  const reconPct = scanning ? reconProgress(scoutFleet, now) : 0;

  const setOp = (id) => setMode((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-4 relative">
      <button onClick={onClear} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>

      {/* PLANETARY COMMAND */}
      <div className="pr-11">
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="h-4 w-4 text-cyan-300" />
          <p className="command-label">Planetary Command</p>
        </div>
        <h3 className="font-heading text-lg uppercase tracking-wide text-white">{intel.system_name}</h3>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cyan-200/65">
          {mine ? 'Sovereign Territory' : `Owner: ${intel.owner_name || 'Unknown'}`} · {relationship || 'Unconfirmed'}
        </p>
      </div>

      {/* SYSTEM STATUS */}
      <CommandSection label="System Status" icon={Activity}>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-cyan-400/15 bg-slate-950/35 p-2.5">
            <p className="command-label">Coordinates</p>
            <p className="mt-1 font-mono text-xs text-cyan-100">{Math.round(target.map_x)}, {Math.round(target.map_y)}</p>
          </div>
          <div className="rounded-lg border border-cyan-400/15 bg-slate-950/35 p-2.5">
            <p className="command-label">Distance</p>
            <p className="mt-1 font-mono text-xs text-cyan-100">{ly != null ? `${ly.toFixed(1)} LY` : '—'}</p>
          </div>
          <div className="rounded-lg border border-cyan-400/15 bg-slate-950/35 p-2.5">
            <p className="command-label">Relationship</p>
            <p className="mt-1 font-mono text-xs text-cyan-100">{mine ? 'Sovereign' : relationship || 'Unconfirmed'}</p>
          </div>
          <div className="rounded-lg border border-cyan-400/15 bg-slate-950/35 p-2.5">
            <p className="command-label">Last Scouted</p>
            <p className="mt-1 font-mono text-xs text-cyan-100">{intel.last_scouted_date ? formatStale(intel.last_scouted_date) : 'Never'}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-cyan-400/15 bg-slate-950/35 p-2.5">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /><span className="command-label">Recon Status</span></span>
          <span className={`font-mono text-xs ${LEVEL_COLOR[intel.intelligence_level] || 'text-slate-400'}`}>{LEVEL[intel.intelligence_level]}</span>
        </div>
      </CommandSection>

      {/* Recon activity panel (only when a scout is present) */}
      {showReconPanel && (
        <div className={`rounded-lg border p-3 ${scanning ? 'border-cyan-300/50 bg-cyan-950/15' : 'border-amber-400/40 bg-amber-950/10'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Satellite className={`h-4 w-4 ${scanning ? 'text-cyan-300 animate-pulse-glow' : 'text-amber-300'}`} />
            <div>
              <p className="command-label">{scanning ? 'Reconnaissance In Progress' : 'Scout Arrived'}</p>
              <p className="font-heading text-xs uppercase tracking-wider text-cyan-100">{scanning ? 'Scanning System...' : 'Reconnaissance Available'}</p>
            </div>
          </div>
          {scanning ? (
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] transition-all duration-300" style={{ width: `${Math.round(reconPct * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                <span className="text-cyan-200/70">{scoutFleet.scout_class} scan</span>
                <span className="text-cyan-200">{reconRemaining > 0 ? formatDuration(reconRemaining) : 'Completing...'}</span>
              </div>
            </div>
          ) : (
            <button onClick={conductRecon} disabled={reconBusy} className="command-btn flex h-11 w-full items-center justify-center gap-2 rounded-lg disabled:opacity-50">
              {reconBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
              <span className="font-heading text-xs tracking-widest">CONDUCT RECON</span>
            </button>
          )}
        </div>
      )}

      {/* SYSTEM INTELLIGENCE */}
      <CommandSection label="System Intelligence" icon={ScanSearch}>
        <IntelligencePanel intel={intel} />
      </CommandSection>

      {/* AVAILABLE OPERATIONS */}
      {!mine && (
        <CommandSection label="Available Operations" icon={Crosshair}>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <OpButton active={mode === 'forces'} available label="Send Forces" Icon={Rocket} onClick={() => setOp('forces')} primary />
              <OpButton active={mode === 'scout'} available label="Send Scout" Icon={Radar} onClick={() => setOp('scout')} primary />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <OpButton active={mode === 'spy'} available={false} label="Spy / Recon" Icon={ScanSearch} onClick={() => setOp('spy')} />
              <OpButton active={mode === 'talks'} available={false} label="Diplomatic Talks" Icon={Handshake} onClick={() => setOp('talks')} />
            </div>
          </div>

          {mode === 'forces' && <DispatchFleet target={target} myEmpire={myEmpire} onDispatched={() => setMode(null)} />}
          {mode === 'scout' && <ScoutDispatch target={target} myEmpire={myEmpire} onDispatched={() => setMode(null)} />}
          {mode === 'spy' && <ComingSoonPanel title="Spy Network" description="No operational spy network is deployed in this sector. Intelligence must be gathered via scout reconnaissance." onClose={() => setMode(null)} />}
          {mode === 'talks' && <ComingSoonPanel title="Diplomatic Channels" description="Diplomatic relations are not yet established with this system. Subspace negotiations are unavailable." onClose={() => setMode(null)} />}
        </CommandSection>
      )}
    </div>
  );
}