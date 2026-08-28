import React from 'react';

// Display-only tags describing what a tech unlocks. The actual gating is
// still driven by the `unlocks` field; these tags are purely visual cues.
const TAG_STYLES = {
  ship: { chip: 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200', letter: 'S', title: 'Unlocks a ship hull' },
  empire_upgrade: { chip: 'border-violet-400/60 bg-violet-400/10 text-violet-200', letter: 'E', title: 'Unlocks an empire-wide upgrade' },
  ship_upgrade: { chip: 'border-amber-400/60 bg-amber-400/10 text-amber-200', letter: 'U', title: 'Unlocks ship upgrades' },
  military: { chip: 'border-rose-400/60 bg-rose-400/10 text-rose-200', letter: 'M', title: 'Unlocks a military capability' },
};

export default function UnlockBadges({ tags, size = 'sm' }) {
  if (!tags || tags.length === 0) return null;
  const cls = size === 'lg' ? 'text-[10px] px-1.5 py-0.5' : 'text-[8px] leading-none px-1 py-px';
  return (
    <span className="inline-flex items-center gap-0.5">
      {tags.map((t) => {
        const ts = TAG_STYLES[t];
        if (!ts) return null;
        return (
          <span key={t} title={ts.title} className={`font-mono ${cls} rounded border ${ts.chip}`}>
            {ts.letter}
          </span>
        );
      })}
    </span>
  );
}