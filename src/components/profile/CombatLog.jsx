import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getUnit } from '@/data/units';
import { computeSurvivorMap } from '@/lib/battleNotify.jsx';
import { ShieldCheck, ShieldX, Users, Swords, Loader2, X, Rocket, Coins, Crosshair, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RES_LABELS = {
  berentium: 'Berentium',
  ferrite_titanium: 'Ferrite-Titanium',
  aetherium_crystal: 'Aetherium Crystal',
  energy: 'Energy',
  vrind: 'VRIND',
};

// Returns the per-type breakdown lines for a manifest/losses/survivor map,
// sorted by count descending so the largest commitments are read first.
function typeBreakdown(map) {
  if (!map || !Object.keys(map).length) return [];
  return Object.entries(map)
    .filter(([, n]) => n > 0)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .map(([type, n]) => {
      const unit = getUnit(type);
      const name = unit ? unit.name : type.replace(/_/g, ' ');
      return { name, count: n };
    });
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground text-right min-w-0">{children}</span>
    </div>
  );
}

// Expanded Combat Log: for each completed engagement, shows the battle result,
// target system, forces committed, per-type ship losses and survivors, enemy
// defense strength, ground-combat outcome, loot, and return status — using
// only data actually stored on the resolved Fleet record. Legacy fleets
// (no ship_manifest) fall back to fleet_size/survivors totals.
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
            const date = f.return_departure_date || f.return_arrival_date || f.arrival_date;
            const hasManifest = Object.keys(f.ship_manifest || {}).length > 0;
            const committed = typeBreakdown(f.ship_manifest);
            const losses = typeBreakdown(f.ship_losses);
            const survivorMap = computeSurvivorMap(f);
            const survivors = typeBreakdown(survivorMap);
            const totalCommitted = Object.values(f.ship_manifest || {}).reduce((s, n) => s + (n || 0), 0);
            const totalLost = Object.values(f.ship_losses || {}).reduce((s, n) => s + (n || 0), 0);
            const totalSurv = Object.values(survivorMap).reduce((s, n) => s + n, 0);
            const lootLines = Object.entries(f.loot || {})
              .filter(([k, n]) => RES_LABELS[k] && n > 0)
              .map(([k, n]) => `+${n.toLocaleString()} ${RES_LABELS[k]}`);
            const returned = f.status === 'arrived';
            const returnArrival = f.return_arrival_date ? new Date(f.return_arrival_date) : null;

            return (
              <div key={f.id} className="glass-panel rounded-lg p-4">
                {/* ── Header: result + target + date ── */}
                <div className="flex items-start gap-3">
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
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${
                          win
                            ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                            : 'bg-rose-400/15 text-rose-300 border border-rose-400/30'
                        }`}
                      >
                        {win ? 'Win' : 'Loss'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-body">
                      <Flag className="w-3 h-3 shrink-0" />
                      <span>Assault on <span className="text-cyan-100">{f.target_empire_name || 'Unknown'}</span></span>
                    </div>
                    {date && (
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {new Date(date).toLocaleString()} · {formatDistanceToNow(new Date(date), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Detail grid ── */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
                  {/* Left column */}
                  <div className="pr-1">
                    {/* Forces committed */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Swords className="w-3 h-3 text-cyan-300/60" />
                      <p className="text-[10px] uppercase tracking-widest text-cyan-300/70">Forces Committed</p>
                    </div>
                    {committed.length > 0 ? (
                      <div className="space-y-0.5 mb-2">
                        {committed.map((e) => (
                          <p key={e.name} className="text-xs text-foreground">{e.name} ×{e.count}</p>
                        ))}
                        <p className="text-[10px] font-mono text-muted-foreground">Total: {totalCommitted} ships</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-2">{f.fleet_size ?? 0} deployed</p>
                    )}
                    {f.attacker_strength != null && (
                      <DetailRow label="Fleet Strength">{f.attacker_strength.toLocaleString()}</DetailRow>
                    )}

                    {/* Losses */}
                    <div className="flex items-center gap-1.5 mb-1 mt-2">
                      <ShieldX className="w-3 h-3 text-rose-300/60" />
                      <p className="text-[10px] uppercase tracking-widest text-rose-300/70">Losses</p>
                    </div>
                    {losses.length > 0 ? (
                      <div className="space-y-0.5 mb-2">
                        {losses.map((e) => (
                          <p key={e.name} className="text-xs text-rose-200">{e.name} ×{e.count}</p>
                        ))}
                        <p className="text-[10px] font-mono text-muted-foreground">Total: {totalLost} lost</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-2">{hasManifest ? 'None' : `${totalLost || 0} lost`}</p>
                    )}

                    {/* Survivors */}
                    <div className="flex items-center gap-1.5 mb-1 mt-2">
                      <Users className="w-3 h-3 text-emerald-300/60" />
                      <p className="text-[10px] uppercase tracking-widest text-emerald-300/70">Survivors</p>
                    </div>
                    {survivors.length > 0 ? (
                      <div className="space-y-0.5">
                        {survivors.map((e) => (
                          <p key={e.name} className="text-xs text-emerald-200">{e.name} ×{e.count}</p>
                        ))}
                        <p className="text-[10px] font-mono text-muted-foreground">Total: {totalSurv} survived</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{f.survivors ?? 0} survivors</p>
                    )}
                  </div>

                  {/* Right column */}
                  <div className="sm:pl-4 pt-2 sm:pt-0">
                    {/* Enemy */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Crosshair className="w-3 h-3 text-amber-300/60" />
                      <p className="text-[10px] uppercase tracking-widest text-amber-300/70">Enemy</p>
                    </div>
                    {f.defender_strength != null ? (
                      <DetailRow label="Defense Strength">{f.defender_strength.toLocaleString()}</DetailRow>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-2">Unknown</p>
                    )}

                    {/* Ground result */}
                    {f.ground_outcome && (
                      <>
                        <div className="flex items-center gap-1.5 mb-1 mt-2">
                          <Flag className="w-3 h-3 text-violet-300/60" />
                          <p className="text-[10px] uppercase tracking-widest text-violet-300/70">Ground Assault</p>
                        </div>
                        <p className={`text-xs ${f.ground_outcome === 'win' ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {f.ground_outcome === 'win' ? 'Captured' : 'Repelled'}
                        </p>
                        {f.ground_survivors && Object.keys(f.ground_survivors).length > 0 && (
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {Object.values(f.ground_survivors).reduce((s, n) => s + (n || 0), 0)} ground surv
                          </p>
                        )}
                      </>
                    )}

                    {/* Loot */}
                    {lootLines.length > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 mb-1 mt-2">
                          <Coins className="w-3 h-3 text-amber-300/60" />
                          <p className="text-[10px] uppercase tracking-widest text-amber-300/70">Loot</p>
                        </div>
                        <div className="space-y-0.5">
                          {lootLines.map((l) => (
                            <p key={l} className="text-xs text-amber-200">{l}</p>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Return status */}
                    <div className="flex items-center gap-1.5 mb-1 mt-2">
                      <Rocket className="w-3 h-3 text-violet-300/60" />
                      <p className="text-[10px] uppercase tracking-widest text-violet-300/70">Return Status</p>
                    </div>
                    <p className={`text-xs ${returned ? 'text-emerald-300' : 'text-violet-300'}`}>
                      {returned ? 'Returned' : 'Returning'}
                    </p>
                    {returnArrival && !returned && (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        ETA {returnArrival.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}