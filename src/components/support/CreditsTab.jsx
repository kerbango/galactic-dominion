import React from 'react';
import { Crown, Code, Gamepad2, Heart } from 'lucide-react';

const CREDITS = [
  {
    role: 'Creator',
    name: 'Kerbango',
    studio: 'Mimics Den Games',
    icon: Crown,
    color: 'text-amber-300',
    ring: 'border-amber-400/30 bg-amber-400/10'
  },
  {
    role: 'Code Tester',
    name: 'PainNGain',
    studio: 'Reanimate Games',
    icon: Code,
    color: 'text-cyan-300',
    ring: 'border-cyan-400/30 bg-cyan-400/10'
  },
  {
    role: 'Tester',
    name: 'ReinaKuro',
    studio: '',
    icon: Code,
    color: 'text-emerald-300',
    ring: 'border-emerald-400/30 bg-emerald-400/10'
  },
  {
    role: 'Play Tester',
    name: 'Jack23Tek',
    studio: '',
    icon: Gamepad2,
    color: 'text-violet-300',
    ring: 'border-violet-400/30 bg-violet-400/10'
  }
];

export default function CreditsTab() {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-2xl p-6 text-center">
        <h2 className="font-heading text-lg tracking-[0.2em] text-white neon-text uppercase mb-2">
          The Krin Wars
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Built with passion by a tiny crew of galactic architects.
        </p>
      </section>

      <div className="space-y-4">
        {CREDITS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.role} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
              <div className={`shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl border ${c.ring}`}>
                <Icon className={`w-6 h-6 ${c.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-200/60">{c.role}</p>
                <p className="font-heading text-base tracking-wide text-white uppercase">{c.name}</p>
                {c.studio && (
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{c.studio}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-widest text-slate-400/50 pt-2">
        <Heart className="w-3 h-3 text-rose-400/50" />
        Thank you for playing
      </p>
      <p className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-400/40">
        © {new Date().getFullYear()} Mimics Den Games
      </p>
    </div>
  );
}