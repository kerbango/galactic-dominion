import React, { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SpaceBackground from '@/components/SpaceBackground';
import SiteFooter from '@/components/SiteFooter';
import { EmpireProvider } from '@/lib/EmpireContext';
import BottomNav from '@/components/BottomNav';

// Route order used to derive slide direction (forward = push left, back =
// push right). Routes outside this list default to a forward push.
const ROUTE_ORDER = [
  '/console', '/map', '/military', '/research', '/upgrades',
  '/market', '/alliance', '/comms', '/profile', '/support',
];

export default function GameLayout() {
  const location = useLocation();
  const prevIdx = useRef(ROUTE_ORDER.indexOf(location.pathname));
  const idx = ROUTE_ORDER.indexOf(location.pathname);
  const dir = idx >= 0 && prevIdx.current >= 0 ? (idx >= prevIdx.current ? 1 : -1) : 1;
  if (idx >= 0) prevIdx.current = idx;

  return (
    <div className="relative min-h-screen w-full">
      <SpaceBackground dim={0.35} />
      {/*
        Bottom padding clears the fixed BottomNav (h-14 + safe-area inset) so
        the SiteFooter and page content are never obscured on mobile. Top
        safe-area is handled by the sticky TopNav, so it is not duplicated here.
      */}
      <div className="relative z-10 flex flex-col min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        <main className="flex-1">
          <EmpireProvider>
            {/*
              Keyed by pathname so each route change remounts the page content
              with a subtle horizontal slide. EmpireProvider stays mounted
              above this boundary, so empire state persists across navigations
              (no refetch / loading flash on tab switches).
            */}
            <motion.div
              key={location.pathname}
              className="overflow-x-clip"
              initial={{ opacity: 0, x: dir * 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </EmpireProvider>
        </main>
        <SiteFooter />
        <BottomNav />
      </div>
    </div>
  );
}