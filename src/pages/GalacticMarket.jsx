import React, { useState } from 'react';
import { Store } from 'lucide-react';
import MarketTabs from '@/components/market/MarketTabs';
import AvailableResources from '@/components/market/AvailableResources';
import PlayerMarketPanel from '@/components/market/PlayerMarketPanel';
import ResourceMarketPanel from '@/components/market/ResourceMarketPanel';

// Galactic Markets — a single page with two inline panels switched by the
// MarketTabs. The Player Market lets players list/buy empire resources; the
// Resource Market is an admin-controlled fixed-price raw material shop.
export default function GalacticMarket() {
  const [tab, setTab] = useState('player');

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col items-center text-center gap-1 mb-8">
        <Store className="w-7 h-7 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Galactic Markets
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
          Trade resources across the galaxy
        </p>
      </div>

      <AvailableResources />
      <MarketTabs active={tab} onSelect={setTab} />

      {tab === 'player' ? <PlayerMarketPanel /> : <ResourceMarketPanel />}
    </div>
  );
}