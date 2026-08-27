import React from 'react';
import { Wrench, FlaskConical } from 'lucide-react';

// Placeholder shown for Operations modules that are not yet built. They come
// online once the research trees and upgrades systems are configured.
export default function UnderConstruction({ title }) {
  return (
    <div className="glass-panel rounded-2xl p-10 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 mb-4">
        <Wrench className="w-8 h-8 text-amber-300 animate-pulse-glow" />
      </div>
      <h3 className="font-heading text-lg tracking-wide text-amber-100 uppercase mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        This module is under construction. It will come online once the research trees and upgrades systems are configured.
      </p>
      <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono uppercase tracking-widest text-amber-300/60">
        <FlaskConical className="w-3.5 h-3.5" /> Pending Research &amp; Upgrades
      </div>
    </div>
  );
}