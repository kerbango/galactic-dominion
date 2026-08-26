import React from 'react';
import { Layers, Construction } from 'lucide-react';
import MarketTabs from '@/components/market/MarketTabs';
import AvailableResources from '@/components/market/AvailableResources';

// Galactic Resource Market — exchange raw resources between empires. Sits at
// /market/resources alongside the general Galactic Market at /market.
export default function GalacticResourceMarket() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center gap-1 mb-8">
        <Layers className="w-7 h-7 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Galactic Resource Market
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
          Exchange raw materials
        </p>
      </div>

      <AvailableResources />
      <MarketTabs />

      <div className="glass-panel-strong rounded-2xl p-10 text-center">
        <Construction className="w-10 h-10 text-cyan-300/70 mx-auto mb-4" />
        <p className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-2">System Offline</p>
        <p className="text-muted-foreground font-body">
          The Resource Market is under construction. Check back soon.
        </p>
      </div>
    </div>
  );
}