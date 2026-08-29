import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radar, Sword, Store, User } from 'lucide-react';

// Mobile-only sticky bottom tab bar. Quick-access for the five core
// game screens; the remaining routes stay reachable via the top hamburger.
// Uses NavLink (push, not replace) so the browser navigation stack is
// preserved. Hidden on >= sm viewports where the desktop inline nav is used.
const TABS = [
  { to: '/console', label: 'Command', Icon: LayoutDashboard },
  { to: '/map', label: 'Map', Icon: Radar },
  { to: '/military', label: 'Military', Icon: Sword },
  { to: '/market', label: 'Market', Icon: Store },
  { to: '/profile', label: 'Ops', Icon: User },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 glass-panel-strong border-t border-cyan-400/20 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch justify-around h-14">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] transition-colors ${
                isActive ? 'text-cyan-200' : 'text-muted-foreground hover:text-cyan-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]' : ''}`}
                />
                <span className="font-heading text-[10px] uppercase tracking-widest">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}