import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { TECH_TREE, CATEGORIES, totalResearchSpeedBonus } from '@/data/techTree';
import TechIcon from './techIcons';
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react';
import { researchPoolMaximum } from '../../../base44/shared/researchAllocation';

const techById = Object.fromEntries(TECH_TREE.map((t) => [t.id, t]));

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

  if (!researching.length) return <div className="glass-panel rounded-xl p-4 text-center"><FlaskConical className="w-5 h-5 text-cyan-300/60 mx-auto mb-2" /><p className="font-heading text-sm tracking-wide text-cyan-200/80 uppercase">No Active Research</p><p className="text-xs text-muted-foreground mt-1">Visit the Research Nexus to begin a technology.</p></div>;

  return <div className="space-y-3">{researching.map((rec) => {
    const tech = techById[rec.tech_id];
    const cat = tech ? CATEGORIES[tech.category] : null;
    const required = Math.max(1, Number(rec.research_points_required) || 500);
    const invested = Math.min(required, Math.max(0, Number(rec.research_points_invested) || 0));
    const frac = invested / required;
    const allocation = Math.max(0, Number(rec.allocation_percent) || 0);
    const remaining = Math.max(0, required - invested);
    return <div key={rec.id} className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-3"><div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-cyan-400/20 bg-cyan-400/10"><TechIcon name={(tech && (tech.icon || cat?.icon)) || 'Cpu'} className={`w-4 h-4 ${cat?.color || 'text-slate-300'}`} /></div><div className="flex-1 min-w-0"><p className="font-mono text-[10px] uppercase tracking-widest text-slate-400/80">T{tech?.tier} · {tech?.category}</p><h3 className="font-heading text-sm tracking-wide text-white uppercase leading-tight truncate">{tech ? tech.name : rec.tech_id.replace(/_/g, ' ')}</h3></div><span className="font-mono text-xs text-cyan-200 whitespace-nowrap">{allocation.toFixed(0)}% allocation</span></div>
      <div className="mt-3"><div className="h-2.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${frac * 100}%` }} /></div><div className="flex items-center justify-between mt-1.5"><p className="text-[10px] font-mono text-muted-foreground">{Math.floor(invested).toLocaleString()} / {Math.floor(required).toLocaleString()} RP · {Math.floor(frac * 100)}%</p><p className="text-[10px] font-mono text-cyan-300">{Math.floor(remaining).toLocaleString()} RP remaining</p></div></div>
      <div className="flex justify-between mt-2 text-[9px] font-mono uppercase tracking-widest"><span className="text-slate-500">Pool {Math.floor(empire?.research_points || 0).toLocaleString()} / {poolMax.toLocaleString()}</span>{speedBonus > 0 && <span className="text-amber-300/80">⚡ {Math.round(speedBonus * 100)}% efficiency</span>}</div>
    </div>;
  })}</div>;
}
