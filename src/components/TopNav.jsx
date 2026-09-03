import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { NAV_ITEMS } from '@/lib/navItems';
import ResourceBar from '@/components/ResourceBar';
import MobileMenu from '@/components/MobileMenu';

const ADMIN_ICON_URL = 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/03659bd94_ChatGPTImageAug25202606_09_51PM.png';

// Persistent quick-navigation bar shown on every page (public and
// authenticated). New pages should add their NavLink below.
export default function TopNav() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  // Treasury HUD only on empire-management screens where resources are spent.
  const SHOW_TREASURY_ON = ['/profile', '/research', '/military', '/upgrades', '/market', '/map', '/console'];
  const showTreasury = SHOW_TREASURY_ON.includes(location.pathname);
  const linkClass = ({ isActive }) =>
    `flex items-center gap-1 px-2 py-1 rounded-md text-xs font-heading uppercase tracking-wider whitespace-nowrap transition-colors ${
      isActive ? 'text-cyan-200 bg-cyan-400/10' : 'text-muted-foreground hover:text-cyan-100'
    }`;

  return (
    <header className="sticky top-0 z-30 w-full">
      <div
        className="flex items-center justify-between gap-4 px-4 md:px-8 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] border-b border-cyan-400/15"
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
        <nav className="hidden sm:flex items-center gap-0.5 flex-1 justify-center min-w-0">
          {NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin).map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={async () => {
              await base44.auth.logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-heading uppercase tracking-wider text-muted-foreground hover:text-rose-300 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          {isAdmin && (
            <Link
              to="/admin"
              title="Admin panel"
              className="ml-1 relative flex items-center justify-center w-7 h-7 rounded-full overflow-hidden border border-cyan-400/50 hover:border-cyan-300 bg-cyan-400/10 transition-colors"
            >
              <Shield className="absolute inset-0 m-auto w-4 h-4 text-cyan-300/80" />
              <Image
                src={ADMIN_ICON_URL}
                alt="Admin"
                fittingType="fill"
                className="relative w-full h-full"
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
              className="relative flex items-center justify-center w-11 h-11 rounded-full overflow-hidden border border-cyan-400/50 hover:border-cyan-300 bg-cyan-400/10 transition-colors"
            >
              <Shield className="absolute inset-0 m-auto w-5 h-5 text-cyan-300/80" />
              <Image
                src={ADMIN_ICON_URL}
                alt="Admin"
                fittingType="fill"
                className="relative w-full h-full"
              />
            </Link>
          )}
          <MobileMenu />
        </div>
      </div>
      {isAuthenticated && showTreasury && (
        <div className="flex justify-center px-4 md:px-8 py-1.5 border-b border-cyan-400/10 bg-background/60 backdrop-blur-sm">
          <ResourceBar />
        </div>
      )}
    </header>
  );
}