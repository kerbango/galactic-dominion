import React, { useEffect, useState } from 'react';
import { Handshake, Loader2, Radar, Rocket, ScanSearch, ShieldCheck, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DispatchFleet from '@/components/fleet/DispatchFleet';
import IntelligencePanel from './IntelligencePanel';
import ScoutDispatch from './ScoutDispatch';

const LEVEL = { none: 'UNKNOWN / UNCONFIRMED', light: 'LIGHT SCOUT', medium: 'MEDIUM SCOUT', heavy: 'HEAVY SCOUT' };
export default function PlanetaryCommand({ target, myEmpire, relationship, onClear }) {
  const [intel, setIntel] = useState(null);
  const [mode, setMode] = useState(null);
  const load = () => base44.functions.invoke('getPlanetaryIntelligence', { target_empire_id: target.id }).then((r) => setIntel(r.data));
  useEffect(() => { setIntel(null); setMode(null); load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, [target.id]);
  if (!intel) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div>;
  const mine = target.id === myEmpire?.id;
  const ops = [{ id: 'forces', label: 'Send Forces', Icon: Rocket }, { id: 'scout', label: 'Send Scout', Icon: Radar }, { id: 'spy', label: 'Spy / Recon', Icon: ScanSearch }, { id: 'talks', label: 'Diplomatic Talks', Icon: Handshake }];
  return <div className="space-y-4 relative">
    <button onClick={onClear} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
    <div className="pr-11"><p className="command-label">Planetary Command</p><h3 className="font-heading text-lg uppercase tracking-wide text-white">{intel.system_name}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cyan-200/65">Owner: {intel.owner_name || 'Unknown'} · {relationship || 'Unconfirmed'}</p></div>
    <div className="flex items-center justify-between rounded-lg border border-cyan-400/15 bg-slate-950/35 p-3"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /><span className="command-label">Recon Status</span></span><span className="font-mono text-xs text-amber-200">{LEVEL[intel.intelligence_level]}</span></div>
    <div><p className="command-label mb-2">System Intelligence</p><IntelligencePanel intel={intel} /></div>
    {!mine && <div><p className="command-label mb-2">Available Operations</p><div className="grid grid-cols-2 gap-2">{ops.map(({ id, label, Icon }) => <button key={id} onClick={() => (id === 'forces' || id === 'scout') && setMode(mode === id ? null : id)} disabled={id === 'spy' || id === 'talks'} title={id === 'spy' ? 'No operational spy network' : id === 'talks' ? 'Diplomatic channels unavailable' : ''} className="command-btn flex min-h-11 items-center justify-center gap-2 rounded-lg disabled:opacity-35"><Icon className="h-4 w-4" /><span className="font-heading text-[10px] tracking-wider">{label}</span></button>)}</div></div>}
    {mode === 'forces' && <DispatchFleet target={target} myEmpire={myEmpire} onDispatched={() => setMode(null)} />}
    {mode === 'scout' && <ScoutDispatch target={target} onDispatched={() => setMode(null)} />}
  </div>;
}