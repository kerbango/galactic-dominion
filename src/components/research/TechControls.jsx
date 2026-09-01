import React from 'react';
import { Search, Filter } from 'lucide-react';
import { CATEGORY_ORDER } from '@/data/techTree';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Search, category filter, and show-only toggle. Pure controls — all
// filtering is applied by the parent via the visibleIds set passed to the
// canvas. Restricted categories are added only after their gate is unlocked.
export default function TechControls({ search, setSearch, categoryFilter, setCategoryFilter, showOnly, setShowOnly, includeHiddenCategory = false }) {
  const categories = includeHiddenCategory
    ? [...CATEGORY_ORDER, 'Blacklisted Alien Technology']
    : CATEGORY_ORDER;

  return (
    <div className="glass-panel rounded-2xl p-3 flex flex-wrap items-center gap-2 md:gap-3">
      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search technologies…"
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] h-11 rounded-lg bg-slate-900/60 border-slate-700/50 text-sm text-slate-100 focus:ring-cyan-400/50">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900/95 border-slate-700/50 text-slate-100">
            <SelectItem value="All" className="text-sm text-slate-100 h-11">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-sm text-slate-100 h-11">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-slate-900/60 border border-slate-700/50 p-0.5">
        {[['all', 'All'], ['available', 'Available'], ['researched', 'Done']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setShowOnly(v)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${showOnly === v ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}