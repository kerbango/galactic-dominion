import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, ShieldX, Users, Swords, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Combat log summary: shows the outcome and survivor count of the player's
// most recently resolved fleet engagements. The Dismiss button clears the
// log from the page (client-side only — it does not delete the fleet records).
export default function CombatLog() {
  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const all = await base44.entities.Fleet.filter(
          { created_by_id: user.id },
          '-updated_date',
          50
        );
        if (active) setFleets(all.filter((f) => f.outcome));
      } catch (e) {
        if (active) setFleets([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 mt-10">
        <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase">Combat Log</h2>
        {fleets.length > 0 && (
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex items-center gap-1.5 glass-panel rounded-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-cyan-200 transition-colors"
          >
            <X className="w-3 h-3" /> Dismiss
          </button>
        )}
      </div>

      {fleets.length === 0 ? (
        <div className="glass-panel rounded-lg p-6 text-center text-sm text-muted-foreground font-body">
          No combat engagements recorded.
        </div>
      ) : (
        <div className="space-y-3">
          {fleets.map((f) => {
            const win = f.outcome === 'win';
            const date = f.return_arrival_date || f.arrival_date;
            return (
              <div key={f.id} className="glass-panel rounded-lg p-4 flex items-center gap-4">
                <div
                  className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border ${
                    win
                      ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300'
                      : 'bg-rose-400/10 border-rose-400/30 text-rose-300'
                  }`}
                >
                  {win ? <ShieldCheck className="w-5 h-5" /> : <ShieldX className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-sm uppercase tracking-wide text-foreground">
                      {win ? 'Victory' : 'Defeat'}
                    </span>
                    <span className="text-xs text-muted-foreground font-body truncate">
                      Assault on <span className="text-cyan-100">{f.target_empire_name || 'Unknown'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Swords className="w-3 h-3" /> {f.fleet_size ?? 0} deployed
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {f.survivors ?? 0} survivors
                    </span>
                    {date && (
                      <span className="hidden sm:inline">
                        {formatDistanceToNow(new Date(date), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${
                    win
                      ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                      : 'bg-rose-400/15 text-rose-300 border border-rose-400/30'
                  }`}
                >
                  {win ? 'Win' : 'Loss'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}