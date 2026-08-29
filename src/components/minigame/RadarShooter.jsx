import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Radar, Crosshair, Clock, Heart, Zap, X, RotateCcw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Radar Reaction Shooter — hostile contacts blip onto a radar sweep; tap
// them before their timer ring collapses. Missed contacts cost a life.
// Spawn cadence and contact lifetime both shrink as the wave climbs, so
// the game ramps in difficulty until all lives are spent. Pure client-side.

const START_LIVES = 3;
const BASE_SPAWN_MS = 1100;      // delay between spawns at wave 1
const BASE_LIFETIME_MS = 2200;   // how long a contact stays before expiring
const MIN_SPAWN_MS = 420;
const MIN_LIFETIME_MS = 850;
const WAVE_STEP_MS = 60;         // each wave shaves this off both timers
const CONTACT_VALUE = 100;       // base points per hit
const RADAR_PX = 300;            // play-field size (px), responsive via CSS

const rand = (min, max) => min + Math.random() * (max - min);

// Place a contact at a random point inside the radar circle, kept away from
// the very center so blips don't stack on the sweep origin.
function randomPosition() {
  const r = rand(0.18, 0.92); // fraction of radius
  const a = rand(0, Math.PI * 2);
  return { x: 50 + Math.cos(a) * r * 50, y: 50 + Math.sin(a) * r * 50 };
}

let _id = 0;
const makeContact = (lifetime) => ({
  id: ++_id,
  ...randomPosition(),
  bornAt: performance.now(),
  lifetime,
});

export default function RadarShooter({ onClose, remainingPlays = 5, onSubmitScore }) {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [wave, setWave] = useState(1);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [over, setOver] = useState(false);
  const [sweep, setSweep] = useState(0);
  const [flash, setFlash] = useState(null); // {x,y} hit burst
  const [submitted, setSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const exhausted = remainingPlays <= 0;

  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;
  const runningRef = useRef(running);
  runningRef.current = running;
  const overRef = useRef(over);
  overRef.current = over;

  const spawnMs = Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS - (wave - 1) * WAVE_STEP_MS);
  const lifetimeMs = Math.max(MIN_LIFETIME_MS, BASE_LIFETIME_MS - (wave - 1) * WAVE_STEP_MS);

  const start = useCallback(() => {
    setRunning(true);
    setOver(false);
    setContacts([]);
    setScore(0);
    setLives(START_LIVES);
    setWave(1);
    setHits(0);
    setMisses(0);
    setElapsed(0);
    setSubmitted(false);
    setLastResult(null);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    setContacts([]);
  }, []);

  // Game clock — elapsed time + wave progression (wave climbs every 8s).
  useEffect(() => {
    if (!running || over) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next > 0 && next % 8 === 0) setWave((w) => w + 1);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, over]);

  // Radar sweep rotation (purely cosmetic).
  useEffect(() => {
    if (!running || over) return;
    let raf;
    const tick = () => {
      setSweep((s) => (s + 2) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, over]);

  // Spawner.
  useEffect(() => {
    if (!running || over) return;
    const id = setInterval(() => {
      setContacts((cs) => [...cs, makeContact(lifetimeMs)]);
    }, spawnMs);
    return () => clearInterval(id);
  }, [running, over, spawnMs, lifetimeMs]);

  // Expiry checker — cull contacts whose lifetime elapsed, costing a life.
  useEffect(() => {
    if (!running || over) return;
    const id = setInterval(() => {
      const now = performance.now();
      const survivors = [];
      let lost = 0;
      for (const c of contactsRef.current) {
        if (now - c.bornAt >= c.lifetime) lost++;
        else survivors.push(c);
      }
      if (lost > 0) {
        setContacts(survivors);
        setMisses((m) => m + lost);
        setLives((l) => {
          const next = l - lost;
          return next <= 0 ? 0 : next;
        });
      }
    }, 120);
    return () => clearInterval(id);
  }, [running, over]);

  // Game over when lives hit zero.
  useEffect(() => {
    if (running && lives <= 0 && !over) {
      setOver(true);
      setRunning(false);
      setContacts([]);
    }
  }, [lives, running, over]);

  // Submit the final score once the round ends.
  useEffect(() => {
    if (!over || submitted) return;
    setSubmitted(true);
    if (!onSubmitScore) return;
    onSubmitScore(score, 'radar_shooter')
      .then((res) => {
        setLastResult(res);
        if (res?.my_rank > 0) {
          toast({
            title: `Ranked #${res.my_rank}!`,
            description: `+${res.my_payout} VRIND credited to your empire.`,
          });
        }
      })
      .catch(() => {});
  }, [over, submitted, score, onSubmitScore, toast]);

  const handleHit = (contact) => {
    if (!running || over) return;
    const now = performance.now();
    const remaining = Math.max(0, 1 - (now - contact.bornAt) / contact.lifetime);
    // Faster hits score more — up to 2x for a near-instant tap.
    const bonus = 1 + Math.round(remaining);
    setScore((s) => s + CONTACT_VALUE * bonus);
    setHits((h) => h + 1);
    setContacts((cs) => cs.filter((c) => c.id !== contact.id));
    setFlash({ x: contact.x, y: contact.y });
    setTimeout(() => setFlash(null), 260);
  };

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;

  return (
    <div className="glass-panel-strong rounded-2xl p-4 md:p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-cyan-300" />
          <h2 className="font-heading text-base md:text-lg tracking-[0.2em] text-white neon-text uppercase">
            Radar Defense Drill
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-200/80">
            <Clock className="w-3.5 h-3.5 text-cyan-300/70" />
            <span className="tabular-nums">{mmss}</span>
            <span className="uppercase tracking-widest text-muted-foreground/70 text-[9px]">On Station</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Close minigame"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar */}
        <div className="md:w-44 shrink-0 space-y-3">
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Crosshair className="w-3 h-3 text-emerald-300" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-200/70">Objective</p>
            </div>
            <p className="font-heading text-xs tracking-wide text-emerald-100 uppercase leading-tight">
              Clear Contacts
            </p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">Tap blips before they fade</p>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-amber-300" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-amber-200/70">Score</p>
            </div>
            <p className="font-mono text-xl font-bold text-amber-100 tabular-nums">{score.toLocaleString()}</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/50 mt-1">
              Wave <span className="text-cyan-200">{wave}</span>
            </p>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3 h-3 text-rose-300" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-rose-200/70">Hull Integrity</p>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: START_LIVES }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-sm border ${i < lives ? 'bg-rose-400 border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-transparent border-rose-400/30'}`}
                />
              ))}
            </div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1.5">
              Accuracy <span className="text-cyan-200">{accuracy}%</span>
            </p>
          </div>
        </div>

        {/* Radar field */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="relative rounded-full bg-black/40 border border-cyan-400/20 overflow-hidden"
            style={{ width: 'min(300px, 78vw)', aspectRatio: '1 / 1' }}
          >
            {/* Concentric range rings */}
            {[0.33, 0.66, 1].map((r) => (
              <div
                key={r}
                className="absolute rounded-full border border-cyan-400/15"
                style={{ inset: `${(1 - r) * 50}%` }}
              />
            ))}
            {/* Cross hairs */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/15 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/15 -translate-y-1/2" />
            {/* Sweep beam */}
            {running && !over && (
              <div
                className="absolute inset-0 origin-center"
                style={{
                  background: `conic-gradient(from ${sweep}deg, rgba(34,211,238,0.28), rgba(34,211,238,0) 60deg)`,
                  borderRadius: '9999px',
                }}
              />
            )}
            {/* Center hub */}
            <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

            {/* Contacts */}
            {contacts.map((c) => {
              const age = (performance.now() - c.bornAt) / c.lifetime;
              const ringScale = Math.max(0.2, 1 - age);
              return (
                <button
                  key={c.id}
                  onClick={() => handleHit(c)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ left: `${c.x}%`, top: `${c.y}%`, width: '44px', height: '44px' }}
                  aria-label="hostile contact"
                >
                  {/* collapsing timer ring */}
                  <span
                    className="absolute rounded-full border-2 border-rose-400/70"
                    style={{
                      width: '40px',
                      height: '40px',
                      transform: `scale(${ringScale})`,
                      boxShadow: '0 0 10px rgba(244,63,94,0.5)',
                      transition: 'transform 90ms linear',
                    }}
                  />
                  <span className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse-glow" />
                </button>
              );
            })}

            {/* Hit burst */}
            {flash && (
              <span
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-300 pointer-events-none"
                style={{ left: `${flash.x}%`, top: `${flash.y}%`, width: '34px', height: '34px', boxShadow: '0 0 16px rgba(52,211,153,0.7)', animation: 'flash-red 0.25s ease-out' }}
              />
            )}

            {/* Idle / start overlay */}
            {!running && !over && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-sm">
                <Activity className="w-6 h-6 text-cyan-300" />
                <p className="text-[11px] font-mono uppercase tracking-widest text-cyan-200/80 text-center px-6">
                  Stand by for contact sweep
                </p>
                <Button onClick={start} className="font-heading tracking-widest uppercase text-xs">
                  <Radar className="w-3.5 h-3.5" /> Begin Sweep
                </Button>
              </div>
            )}

            {/* Game over overlay */}
            {over && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 backdrop-blur-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-400/15 border border-rose-400/40 mb-1">
                  <X className="w-6 h-6 text-rose-300" />
                </div>
                <p className="font-heading text-sm tracking-[0.2em] text-rose-100 uppercase">Hull Breached</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Final Score <span className="text-amber-200 font-bold">{score.toLocaleString()}</span>
                </p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/60">
                  Wave {wave} · {accuracy}% Acc
                </p>
                {lastResult?.my_rank > 0 && (
                  <p className="text-[11px] font-mono text-emerald-300 mt-1">
                    Ranked #{lastResult.my_rank} — +{lastResult.my_payout} VRIND
                  </p>
                )}
                {exhausted ? (
                  <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300 mt-2">
                    Daily plays exhausted — return tomorrow
                  </p>
                ) : (
                  <Button onClick={start} className="mt-2 font-heading tracking-widest uppercase text-xs">
                    <RotateCcw className="w-3.5 h-3.5" /> Redeploy
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button onClick={start} disabled={(running && !over) || exhausted} variant="outline" className="flex-1 font-heading tracking-widest uppercase text-xs border-cyan-400/30 text-cyan-100 hover:bg-cyan-400/10">
          <RotateCcw className="w-3.5 h-3.5" /> Restart Drill
        </Button>
        <Button onClick={onClose || stop} variant="ghost" className="flex-1 font-heading tracking-widest uppercase text-xs text-rose-200 hover:bg-rose-400/10">
          <X className="w-3.5 h-3.5" /> Stand Down
        </Button>
      </div>
    </div>
  );
}