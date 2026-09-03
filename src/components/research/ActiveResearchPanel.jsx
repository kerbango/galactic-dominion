import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { TECH_TREE, CATEGORIES, totalResearchSpeedBonus } from '@/data/techTree';
import TechIcon from './techIcons';
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react';
import { researchPoolMaximum } from '../../../base44/shared/researchAllocation';

const techById = Object.fromEntries(TECH_TREE.map((t) => [t.id, t]));
const CYCLES_PER_HOUR = 60;

function formatDuration(ms) {
  if (ms <= 0) return '0m';
  const totalMin = Math.ceil(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ActiveResearchPanel() {
  const { empire } = useEmpire();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const all = await base44.entities.TechProgress.filter({ created_by_id: user.id });
        if (active) setData({ researching: all.filter((r) => r.status === 'researching'), completed: all.filter((r) => r.status === 'completed').map((r) => r.tech_id) });
      } catch { if (active) setData({ researching: [], completed: [] }); }
    };
    load();
    const unsub = base44.entities.TechProgress.subscribe(() => load());
    const poll = setInterval(load, 60000);
    return () => { active = false; unsub?.(); clearInterval(poll); };
  }, []);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  if (data === null) return <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 text-cyan-300 animate-spin" /></div>;
  const { researching, completed } = data;
  const speedBonus = totalResearchSpeedBonus(completed, empire?.research_speed_level || 0);
  const poolMax = researchPoolMaximum(empire?.population || 0);

  if (!researching.length) return <div className="glass-panel rounded-lg px-3 py-2 text-center"><FlaskConical className="w-4 h-4 text-cyan-300/60 inline mr-1.5" /><span className="font-heading text-xs tracking-wide text-cyan-200/80 uppercase">No Active Research</span></div>;

  return <div className="space-y-1.5">{researching.map((rec) => {
    const tech = techById[rec.tech_id];
    const cat = tech ? CATEGORIES[tech.category] : null;
    const required = Math.max(1, Number(rec.research_points_required) || 500);
    const invested = Math.min(required, Math.max(0, Number(rec.research_points_invested) || 0));
    const frac = invested / required;
    const allocation = Math.max(0, Number(rec.allocation_percent) || 0);
    const remaining = Math.max(0, required - invested);
    const rpPerHour = poolMax * (allocation / 100) * (1 + Math.max(0, speedBonus));
    const currentSurplus = Math.max(0, Number(empire?.research_points || 0)) * (allocation / 100) * (1 + Math.max(0, speedBonus));
    const effectiveRemaining = Math.max(0, remaining - currentSurplus);
    const etaMs = rpPerHour > 0 ? (effectiveRemaining / rpPerHour) * 3600000 : null;
    return <div key={rec.id} className="glass-panel rounded-lg px-3 py-2">
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border border-cyan-400/20 bg-cyan-400/10"><TechIcon name={(tech && (tech.icon || cat?.icon)) || 'Cpu'} className={`w-3.5 h-3.5 ${cat?.color || 'text-slate-300'}`} /></div>
        <div className="flex-1 min-w-0"><h3 className="font-heading text-xs tracking-wide text-white uppercase leading-tight truncate">{tech ? tech.name : rec.tech_id.replace(/_/g, ' ')}</h3><p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{Math.floor(invested).toLocaleString()}/{Math.floor(required).toLocaleString()} RP · {Math.floor(frac * 100)}% · {Math.floor(remaining).toLocaleString()} left · ETA {etaMs === null ? 'paused' : formatDuration(etaMs)}{speedBonus > 0 ? ` · ⚡${Math.round(speedBonus * 100)}%` : ''}</p></div>
        <span className="font-mono text-[11px] text-cyan-200 whitespace-nowrap">{allocation.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${frac * 100}%` }} /></div>
    </div>;
  })}</div>;
}