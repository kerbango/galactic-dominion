import React from 'react';
import { Outlet } from 'react-router-dom';
import SpaceBackground from '@/components/SpaceBackground';
import ResourceBar from '@/components/ResourceBar';

export default function GameLayout() {
  return (
    <div className="relative min-h-screen w-full">
      <SpaceBackground dim={0.35} />
      {/* Persistent top HUD — stays visible across all game pages */}
      <header className="sticky top-0 z-30 w-full">
        <div className="relative flex items-center justify-center gap-4 px-4 md:px-8 py-3 border-b border-cyan-400/15"
             style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.85), rgba(5,8,16,0.55))', backdropFilter: 'blur(10px)' }}>
          <span className="absolute left-4 md:left-8 font-heading text-sm md:text-base tracking-[0.25em] text-cyan-100 neon-text uppercase hidden sm:inline">
            Stellar Dominion
          </span>
          <ResourceBar />
        </div>
      </header>
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}