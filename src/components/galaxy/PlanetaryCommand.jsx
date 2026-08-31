import React, { useEffect, useRef, useState } from 'react';
import { Handshake, Loader2, Radar, Rocket, ScanSearch, ShieldCheck, Satellite, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { reconProgress, reconRemainingSeconds, formatDuration } from '@/lib/galaxy';
import DispatchFleet from '@/components/fleet/DispatchFleet';
import IntelligencePanel from './IntelligencePanel';
import ScoutDispatch from './ScoutDispatch';

const LEVEL = { none: 'UNKNOWN / UNCONFIRMED', light: 'LIGHT SCOUT', medium: 'MEDIUM SCOUT', heavy: 'HEAVY SCOUT' };

export default function PlanetaryCommand({ target, myEmpire, relationship, scoutFleet, now, onClear }) {
  const [intel, setIntel] = useState(null);
  const [mode, setMode] = useState(null);
  const [reconBusy, setReconBusy] = useState(false);
  const completingRef = useRef(false);

  const load = () => base44.functions.invoke('getPlanetaryIntelligence', { target_empire_id: target.id }).then((r) => setIntel(r.data));
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
    if (end > now) return; // still scanning
    if (completingRef.current) return;
    completingRef.current = true;
    base44.functions.invoke('completeRecon', { fleet_id: scoutFleet.id })
      .then(() => load())
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
  const ops = [{ id: 'forces', label: 'Send Forces', Icon: Rocket }, { id: 'scout', label: 'Send Scout', Icon: Radar }, { id: 'spy', label: 'Spy / Recon', Icon: ScanSearch }, { id: 'talks', label: 'Diplomatic Talks', Icon: Handshake }];

  const showReconPanel = scoutFleet && (scoutFleet.status === 'awaiting_recon' || scoutFleet.status === 'scouting');
  const scanning = scoutFleet?.status === 'scouting';
  const reconRemaining = scanning ? reconRemainingSeconds(scoutFleet, now) : 0;
  const reconPct = scanning ? reconProgress(scoutFleet, now) : 0;

  return <div className="space-y-4 relative">
    <button onClick={onClear} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
    <div className="pr-11"><p className="command-label">Planetary Command</p><h3 className="font-heading text-lg uppercase tracking-wide text-white">{intel.system_name}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cyan-200/65">Owner: {intel.owner_name || 'Unknown'} · {relationship || 'Unconfirmed'}</p></div>
    <div className="flex items-center justify-between rounded-lg border border-cyan-400/15 bg-slate-950/35 p-3"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /><span className="command-label">Recon Status</span></span><span className="font-mono text-xs text-amber-200">{LEVEL[intel.intelligence_level]}</span></div>

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

    <div><p className="command-label mb-2">System Intelligence</p><IntelligencePanel intel={intel} /></div>
    {!mine && <div><p className="command-label mb-2">Available Operations</p><div className="grid grid-cols-2 gap-2">{ops.map(({ id, label, Icon }) => <button key={id} onClick={() => (id === 'forces' || id === 'scout') && setMode(mode === id ? null : id)} disabled={id === 'spy' || id === 'talks'} title={id === 'spy' ? 'No operational spy network' : id === 'talks' ? 'Diplomatic channels unavailable' : ''} className="command-btn flex min-h-11 items-center justify-center gap-2 rounded-lg disabled:opacity-35"><Icon className="h-4 w-4" /><span className="font-heading text-[10px] tracking-wider">{label}</span></button>)}</div></div>}
    {mode === 'forces' && <DispatchFleet target={target} myEmpire={myEmpire} onDispatched={() => setMode(null)} />}
    {mode === 'scout' && <ScoutDispatch target={target} onDispatched={() => setMode(null)} />}
  </div>;
}