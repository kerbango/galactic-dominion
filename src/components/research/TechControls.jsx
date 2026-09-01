import React from 'react';
import { Search, Filter } from 'lucide-react';
import { CATEGORY_ORDER } from '@/data/techTree';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Presentation-only controls for the research canvas. Filtering behavior is
// unchanged; this component now presents the five major research sectors as
// a tactical command strip inspired by the new Research Nexus visual style.
export default function TechControls({ search, setSearch, categoryFilter, setCategoryFilter, showOnly, setShowOnly, includeHiddenCategory = false }) {
  const categories = includeHiddenCategory
    ? [...CATEGORY_ORDER, 'Blacklisted Alien Technology']
    : CATEGORY_ORDER;

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-[#06111d]/90 overflow-hidden shadow-[0_0_25px_rgba(8,145,178,0.06)]">
      <div className="flex overflow-x-auto border-b border-cyan-400/15">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`shrink-0 px-4 md:px-6 py-3 text-[10px] md:text-xs font-mono uppercase tracking-[0.14em] border-r border-cyan-400/10 transition-all ${categoryFilter === 'All' ? 'text-cyan-100 bg-cyan-400/10 shadow-[inset_0_-2px_0_rgba(34,211,238,0.9)]' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]'}`}
        >All Research</button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`shrink-0 px-4 md:px-6 py-3 text-[10px] md:text-xs font-mono uppercase tracking-[0.14em] border-r border-cyan-400/10 transition-all ${categoryFilter === c ? 'text-cyan-100 bg-cyan-400/10 shadow-[inset_0_-2px_0_rgba(34,211,238,0.9)]' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]'}`}
          >{c}</button>
        ))}
      </div>

      <div className="p-2 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technology network…"
            className="w-full pl-8 pr-3 py-2 rounded-md bg-[#02070d]/80 border border-slate-700/50 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[145px] h-9 rounded-md bg-[#02070d]/80 border-slate-700/50 text-xs text-slate-200 focus:ring-cyan-400/30">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950/98 border-slate-700/50 text-slate-100">
              <SelectItem value="All" className="text-xs text-slate-100 h-9">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c} className="text-xs text-slate-100 h-9">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center rounded-md bg-[#02070d]/80 border border-slate-700/50 p-0.5">
          {[['all', 'All'], ['available', 'Available'], ['researched', 'Done']].map(([v, l]) => (
            <button key={v} onClick={() => setShowOnly(v)} className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${showOnly === v ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-500 hover:text-slate-200'}`}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
