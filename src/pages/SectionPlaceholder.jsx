import React from 'react';
import { Construction } from 'lucide-react';

// Generic "module under construction" page backing the new game sections
// (Military, Research, Upgrades, Market, Alliance, Comms) until their
// full implementations are built.
export default function SectionPlaceholder({ title, Icon }) {
  const Ic = Icon || Construction;
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-16">
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        <Ic className="w-8 h-8 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          {title}
        </h1>
      </div>
      <div className="glass-panel-strong rounded-2xl p-10 text-center">
        <Construction className="w-10 h-10 text-cyan-300/70 mx-auto mb-4" />
        <p className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-2">System Offline</p>
        <p className="text-muted-foreground font-body">
          The {title} module is under construction. Check back soon.
        </p>
      </div>
    </div>
  );
}