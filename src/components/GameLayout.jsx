import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import SpaceBackground from '@/components/SpaceBackground';
import { base44 } from '@/api/base44Client';

export default function GameLayout() {
  return (
    <div className="relative min-h-screen w-full">
      <SpaceBackground dim={0.35} />
      {/* Persistent top HUD — stays visible across all game pages */}
      <header className="sticky top-0 z-30 w-full">
        <div className="relative flex items-center justify-center gap-4 px-4 md:px-8 py-3 border-b border-cyan-400/15"
             style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.85), rgba(5,8,16,0.55))', backdropFilter: 'blur(10px)' }}>
          <span className="absolute left-4 md:left-8 font-heading text-sm md:text-base tracking-[0.25em] text-cyan-100 neon-text uppercase hidden sm:inline">
            The Krin Wars
          </span>
          <nav className="absolute right-4 md:right-8 flex items-center gap-1">
            <NavLink
              to="/console"
              className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading uppercase tracking-widest transition-colors ${isActive ? 'text-cyan-200 bg-cyan-400/10' : 'text-muted-foreground hover:text-cyan-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Console
            </NavLink>
            <button
              type="button"
              onClick={async () => { await base44.auth.logout(); window.location.href = '/login'; }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading uppercase tracking-widest text-muted-foreground hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </nav>
        </div>
      </header>
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}