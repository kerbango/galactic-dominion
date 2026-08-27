import React from 'react';
import { LayoutDashboard, Eye, Landmark, Compass, Binoculars, Swords, Flag } from 'lucide-react';

// Sub-navigation for the Operations page. Switches the active panel inline.
export const OPERATIONS_TABS = [
  { key: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { key: 'espionage', label: 'Espionage', Icon: Eye },
  { key: 'political', label: 'Political', Icon: Landmark },
  { key: 'exploration', label: 'Exploration', Icon: Compass },
  { key: 'scouting', label: 'Scouting', Icon: Binoculars },
  { key: 'combat', label: 'Combat Logs', Icon: Swords },
  { key: 'embassy', label: 'Embassy', Icon: Flag },
];

export default function OperationsTabs({ active, onSelect }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {OPERATIONS_TABS.map((t) => {
        const isActive = active === t.key;
        const Ic = t.Icon;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-heading text-xs tracking-[0.15em] uppercase transition-colors ${isActive ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-100' : 'glass-panel text-muted-foreground hover:text-foreground'}`}
          >
            <Ic className="w-4 h-4" /> {t.label}
          </button>
        );
      })}
    </div>
  );
}