import React from 'react';
import { Outlet } from 'react-router-dom';
import SpaceBackground from '@/components/SpaceBackground';
import SiteFooter from '@/components/SiteFooter';
import { EmpireProvider } from '@/lib/EmpireContext';

export default function GameLayout() {
  return (
    <div className="relative min-h-screen w-full">
      <SpaceBackground dim={0.35} />
      <div className="relative z-10">
        <EmpireProvider>
          <Outlet />
        </EmpireProvider>
        <SiteFooter />
      </div>
    </div>
  );
}