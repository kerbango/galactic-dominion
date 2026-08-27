import React from 'react';

// Tiny, theme-matched copyright line shown at the bottom of every page.
export default function SiteFooter() {
  return (
    <footer className="relative z-10 w-full px-4 pb-3 pt-2 text-center">
      <p className="font-mono text-[10px] tracking-widest text-slate-400/40 uppercase select-none">
        © {new Date().getFullYear()} Mimics Den Games
      </p>
    </footer>
  );
}