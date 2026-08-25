import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LogOut, LayoutDashboard, Radar, User } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ResourceBar from '@/components/ResourceBar';
import MobileMenu from '@/components/MobileMenu';

const ADMIN_ICON_URL = 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/03659bd94_ChatGPTImageAug25202606_09_51PM.png';

// Persistent quick-navigation bar shown on every page (public and
// authenticated). New pages should add their NavLink below.
export default function TopNav() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const linkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading uppercase tracking-widest transition-colors ${
      isActive ? 'text-cyan-200 bg-cyan-400/10' : 'text-muted-foreground hover:text-cyan-100'
    }`;

  return (
    <header className="sticky top-0 z-30 w-full">
      <div
        className="flex items-center justify-between gap-4 px-4 md:px-8 py-3 border-b border-cyan-400/15"
        style={{
          background: 'linear-gradient(180deg, rgba(5,8,16,0.85), rgba(5,8,16,0.55))',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Brand — smaller on phone, full on desktop */}
        <span className="font-heading text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.25em] text-cyan-100 neon-text uppercase">
          The Krin Wars
        </span>

        {/* Desktop inline nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/console" className={linkClass}>
            <LayoutDashboard className="w-4 h-4" /> Console
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            <Radar className="w-4 h-4" /> Map
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            <User className="w-4 h-4" /> Profile
          </NavLink>
          <button
            type="button"
            onClick={async () => {
              await base44.auth.logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading uppercase tracking-widest text-muted-foreground hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          {isAdmin && (
            <Link
              to="/admin"
              title="Admin panel"
              className="ml-1 flex items-center justify-center w-7 h-7 rounded-full overflow-hidden border border-cyan-400/20 hover:border-cyan-300/70 transition-colors"
            >
              <Image
                src={ADMIN_ICON_URL}
                alt="Admin"
                fittingType="fill"
                className="w-full h-full"
              />
            </Link>
          )}
        </nav>

        {/* Phone controls: hamburger + admin icon */}
        <div className="flex sm:hidden items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              title="Admin panel"
              className="flex items-center justify-center w-7 h-7 rounded-full overflow-hidden border border-cyan-400/20 hover:border-cyan-300/70 transition-colors"
            >
              <Image
                src={ADMIN_ICON_URL}
                alt="Admin"
                fittingType="fill"
                className="w-full h-full"
              />
            </Link>
          )}
          <MobileMenu />
        </div>
      </div>
      {isAuthenticated && (
        <div className="flex justify-center px-4 md:px-8 py-1.5 border-b border-cyan-400/10 bg-background/60 backdrop-blur-sm">
          <ResourceBar />
        </div>
      )}
    </header>
  );
}