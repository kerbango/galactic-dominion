import React from 'react';
import ResearchSpeedUpgrade from '@/components/upgrades/ResearchSpeedUpgrade';

export default function Upgrades() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">Imperial Upgrades</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">Permanent enhancements for your empire.</p>
      </div>
      <ResearchSpeedUpgrade />
    </div>
  );
}