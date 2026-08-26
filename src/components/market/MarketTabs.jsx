import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Store, Layers } from 'lucide-react';

// Sub-navigation shared by the two market pages so players can switch
// between the general goods market and the resource exchange.
export default function MarketTabs() {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/market', label: 'Player Market', Icon: Store, exact: true },
    { to: '/market/resources', label: 'Resource Market', Icon: Layers, exact: false },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
        const Ic = t.Icon;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-heading text-xs tracking-[0.2em] uppercase transition-colors ${active ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-100' : 'glass-panel text-muted-foreground hover:text-foreground'}`}
          >
            <Ic className="w-4 h-4" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}