import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Shield, Radar, Cpu, ArrowRight, Star } from 'lucide-react';
import SpaceBackground from '@/components/SpaceBackground';

export default function Splash() {
  const [screenSize, setScreenSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <SpaceBackground dim={0.28} />

      {/* Top HUD bar */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Star className="w-7 h-7 text-cyan-300 animate-pulse-glow" />
          </div>
          <span className="font-heading text-xl md:text-2xl tracking-[0.3em] text-cyan-100 neon-text">
            THE&nbsp;KRIN&nbsp;WARS
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-cyan-200/70">
          <span className="flex items-center gap-2"><Radar className="w-4 h-4" /> Sector Online</span>
          <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> {screenSize.w}×{screenSize.h}</span>
        </div>
      </header>

      {/* Center hero */}
      <main className="relative z-20 flex flex-col items-center justify-center px-6 text-center"
            style={{ minHeight: 'calc(100vh - 160px)' }}>
        <div className="animate-float-slow">
          <p className="font-mono text-xs md:text-sm tracking-[0.5em] text-cyan-300/80 uppercase mb-6">
            Galactic Conquest · Real-Time Warfare
          </p>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white neon-text leading-none">
            THE KRIN WARS
          </h1>
          <p className="font-heading text-2xl md:text-4xl tracking-[0.15em] text-cyan-200/90 mt-4">
            GALAXY&nbsp;AT&nbsp;WAR!
          </p>
        </div>

        <p className="max-w-2xl mt-8 text-base md:text-lg text-slate-200/80 font-body leading-relaxed">
          Claim a random sector of the galaxy, research devastating technologies,
          and command fleets, mechs, and soldiers across real-time deep-space warfare.
          Every journey is measured — distance, research, and equipment decide who rules.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link
            to="/register"
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-md glass-panel-strong hover:border-cyan-300/60 transition-all duration-300"
          >
            <Rocket className="w-5 h-5 text-cyan-300 group-hover:translate-x-1 transition-transform" />
            <span className="font-heading text-lg tracking-widest text-white uppercase">Found an Empire</span>
            <ArrowRight className="w-5 h-5 text-cyan-300 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-md glass-panel hover:border-cyan-300/40 transition-all duration-300"
          >
            <Shield className="w-5 h-5 text-cyan-200" />
            <span className="font-heading text-base tracking-widest text-cyan-100 uppercase">Log In</span>
          </Link>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-4xl">
          {[
            { icon: Radar, label: 'Galactic Map', desc: 'Random spaced sectors' },
            { icon: Rocket, label: 'Real-Time Fleet', desc: 'Distance-based travel' },
            { icon: Cpu, label: 'Tech Tree', desc: 'Research to unlock' },
            { icon: Shield, label: 'Empire Profile', desc: 'Build your legend' },
          ].map((f) => (
            <div key={f.label} className="glass-panel rounded-lg p-4 text-left">
              <f.icon className="w-6 h-6 text-cyan-300 mb-2" />
              <p className="font-heading text-sm tracking-wide text-white uppercase">{f.label}</p>
              <p className="text-xs text-slate-300/70 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom HUD */}
      <footer className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 border-t border-cyan-400/10">
        <span className="font-mono text-[10px] tracking-widest text-cyan-200/50 uppercase">
          // The Krin Wars v0.1 — Pre-Alpha
        </span>
        <span className="font-mono text-[10px] tracking-widest text-cyan-200/50 uppercase">
          Fullscreen · {screenSize.w}×{screenSize.h}
        </span>
      </footer>
    </div>
  );
}