import React, { useState } from 'react';
import { Crown, Flag, ChevronDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { distance, travelSeconds, formatDuration, lightYears } from '@/lib/galaxy';

// Searchable dropdown replacement for the always-visible empires list on the
// galactic map side panel. Keeps the panel compact: a trigger button opens a
// popover with a search input and the filtered list. Selecting an empire
// calls onSelectId and closes.
export default function EmpireSearchSelect({ empires, myEmpire, onSelectId }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full glass-panel rounded-lg p-3 flex items-center justify-between gap-2 hover:border-cyan-300/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-heading uppercase tracking-wide text-cyan-100">
            <Search className="w-4 h-4 text-cyan-300" />
            Browse empires
          </span>
          <span className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{empires.length}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-72 border-cyan-400/20" align="start" sideOffset={6}>
        <Command>
          <CommandInput placeholder="Search empires by name or sector..." />
          <CommandList>
            <CommandEmpty>No empires found.</CommandEmpty>
            <CommandGroup>
              {empires.map((e) => {
                const mine = myEmpire && e.id === myEmpire.id;
                const d = myEmpire ? distance(myEmpire, e) : null;
                return (
                  <CommandItem
                    key={e.id}
                    value={`${e.empire_name} ${Math.round(e.map_x)} ${Math.round(e.map_y)}`}
                    onSelect={() => { onSelectId(e.id); setOpen(false); }}
                  >
                    {mine ? <Crown className="text-cyan-300" /> : <Flag className="text-violet-300" />}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`truncate font-heading text-sm uppercase tracking-wide ${mine ? 'text-cyan-100' : 'text-foreground'}`}>
                        {e.empire_name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {Math.round(e.map_x)}, {Math.round(e.map_y)}
                        {d != null && !mine && <span className="text-cyan-300/70"> · {Math.round(lightYears(d))} Ly · {formatDuration(travelSeconds(d))}</span>}
                      </span>
                    </div>
                    {mine && <span className="text-[10px] font-mono uppercase text-cyan-300/80 shrink-0">You</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}