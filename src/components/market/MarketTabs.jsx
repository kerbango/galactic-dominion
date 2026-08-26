import React from 'react';
import { Store, Layers } from 'lucide-react';

// State-driven sub-navigation for the single market page. Switches the
// active panel inline rather than navigating between routes.
export default function MarketTabs({ active, onSelect }) {
  const tabs = [
    { key: 'player', label: 'Player Market', Icon: Store },
    { key: 'resource', label: 'Resource Market', Icon: Layers },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {tabs.map((t) => {
        const isActive = active === t.key;
        const Ic = t.Icon;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-heading text-xs tracking-[0.2em] uppercase transition-colors ${isActive ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-100' : 'glass-panel text-muted-foreground hover:text-foreground'}`}
          >
            <Ic className="w-4 h-4" /> {t.label}
          </button>
        );
      })}
    </div>
  );
}