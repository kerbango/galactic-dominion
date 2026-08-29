import React from 'react';
import { Search } from 'lucide-react';
import { UNIT_CLASSES } from '@/lib/unitClasses';

// Class filter chips + a search box. Drives which units appear in the rail.
// `counts` maps class name -> visible count (used as chip badges).
export default function ClassFilter({ active, onActive, query, onQuery, counts }) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search fleet…"
          className="w-full rounded-lg bg-slate-900/60 border border-slate-700/50 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {UNIT_CLASSES.map((c) => (
          <button
            key={c}
            onClick={() => onActive(c)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border transition-colors ${active === c ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-200' : 'border-slate-700/50 text-slate-400 hover:text-slate-200'}`}
          >
            {c}{counts?.[c] ? ` ${counts[c]}` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}