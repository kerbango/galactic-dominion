import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';

// Martial Law button for the Operations page. Declaring martial law grants
// the 5x production boost instantly, then enters a 60s cooldown before it
// can be used again. The cooldown timer lives on the empire record
// (server-set) so it persists across reloads; this component just counts
// down against it.
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

  const cooldownMs = empire?.martial_law_cooldown_until
    ? new Date(empire.martial_law_cooldown_until).getTime() - now
    : 0;

  const isCooldown = cooldownMs > 0;

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
  if (isCooldown) {
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
      <p className="text-[11px] text-orange-500 text-center uppercase tracking-widest font-bold">
        Grants the 5x production boost instantly · 1 minute cooldown
      </p>
    </div>
  );
}