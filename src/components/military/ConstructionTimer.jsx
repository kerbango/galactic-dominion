import React, { useState, useEffect, useRef } from 'react';
import { Rocket } from 'lucide-react';
import { computeBuildCompletionMs } from '@/data/units';
import { BASE_TURN_SECONDS } from '@/data/techTree';

// Live countdown for an in-progress ship construction. Completion is
// time-based (start_date + construction_turns * BASE_TURN_SECONDS). When the
// timer hits zero, fires onComplete once so the parent can finalize the
// build via the owner-callable tick (tickMyEmpire processes builds) and
// reload the roster.
export default function ConstructionTimer({ record, onComplete }) {
  const startMs = record?.construction_start_date ? new Date(record.construction_start_date).getTime() : 0;
  const turns = record?.construction_turns || 1;
  const completionMs = computeBuildCompletionMs(startMs, turns);
  const [now, setNow] = useState(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, completionMs - now);
  const total = turns * BASE_TURN_SECONDS * 1000;
  const pct = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;
  const done = remaining <= 0;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  }, [done, onComplete]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const label = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-cyan-200/80 mb-1">
        <span className="inline-flex items-center gap-1"><span className="led led-amber" /><Rocket className="w-3 h-3" /> Constructing</span>
        <span className={`inline-flex items-center gap-1 ${done ? 'text-emerald-300' : ''}`}><span className={`led ${done ? 'led-green' : 'led-amber'}`} />{done ? 'Ready' : label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div className="h-full bg-cyan-400/80 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}