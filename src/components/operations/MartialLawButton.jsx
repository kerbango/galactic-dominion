import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';

// Martial Law button for the Operations page. When ready, declaring martial
// law boosts all production to 5x for 60s, then enters a 60s cooldown. The
// active and cooldown timers live on the empire record (server-set), so they
// persist across reloads; this component just counts down against them.
export default function MartialLawButton() {
  const { empire, refresh } = useEmpire();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Tick the local clock every second so the countdowns stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeMs = empire?.martial_law_active_until
    ? new Date(empire.martial_law_active_until).getTime() - now
    : 0;
  const cooldownMs = empire?.martial_law_cooldown_until
    ? new Date(empire.martial_law_cooldown_until).getTime() - now
    : 0;

  const isActive = activeMs > 0;
  const isCooldown = !isActive && cooldownMs > 0;
  const isReady = !isActive && !isCooldown;

  const handleActivate = async () => {
    setBusy(true);
    setError('');
    try {
      await base44.functions.invoke('activateMartialLaw', {});
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to declare martial law.');
    } finally {
      setBusy(false);
    }
  };

  const fmt = (ms) => Math.ceil(ms / 1000);
  const base = 'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-heading text-sm tracking-[0.2em] uppercase transition-colors';

  let button;
  if (isActive) {
    button = (
      <button disabled className={`${base} bg-red-500/20 border border-red-400/50 text-red-200 cursor-not-allowed`}>
        <ShieldAlert className="w-4 h-4 animate-pulse-glow" /> Martial Law Active — {fmt(activeMs)}s
      </button>
    );
  } else if (isCooldown) {
    button = (
      <button disabled className={`${base} bg-muted/40 border border-border text-muted-foreground cursor-not-allowed`}>
        <Loader2 className="w-4 h-4 opacity-60" /> Cooldown — {fmt(cooldownMs)}s
      </button>
    );
  } else {
    button = (
      <button
        onClick={handleActivate}
        disabled={busy}
        className={`${base} bg-red-500/15 border border-red-400/40 text-red-100 hover:bg-red-500/25`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />} Declare Martial Law
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {button}
      {error && <p className="text-xs text-red-300 text-center">{error}</p>}
      {isReady && (
        <p className="text-[11px] text-muted-foreground text-center uppercase tracking-widest">
          Boosts all production to 5x for 60s · 60s cooldown
        </p>
      )}
    </div>
  );
}