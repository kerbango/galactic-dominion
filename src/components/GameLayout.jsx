import React from 'react';
import { Outlet } from 'react-router-dom';
import SpaceBackground from '@/components/SpaceBackground';

export default function GameLayout() {
  return (
    <div className="relative min-h-screen w-full">
      <SpaceBackground dim={0.35} />
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}