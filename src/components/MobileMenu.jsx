import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Radar, User, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Phone-only hamburger dropdown for the quick-nav links. Closes on
// link click, outside click, and route change.
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-heading uppercase tracking-widest transition-colors ${
      isActive ? 'text-cyan-200 bg-cyan-400/10' : 'text-muted-foreground hover:text-cyan-100'
    }`;

  return (
    <div className="relative sm:hidden" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-cyan-100 hover:bg-cyan-400/10 transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="glass-panel-strong absolute right-0 top-full mt-2 w-52 rounded-xl p-2 flex flex-col gap-1 z-50">
          <NavLink to="/console" className={linkClass}>
            <LayoutDashboard className="w-4 h-4" /> Console
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            <Radar className="w-4 h-4" /> Map
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            <User className="w-4 h-4" /> Profile
          </NavLink>
          <div className="hud-divider my-1" />
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await base44.auth.logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-heading uppercase tracking-widest text-muted-foreground hover:text-rose-300 hover:bg-rose-400/5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}