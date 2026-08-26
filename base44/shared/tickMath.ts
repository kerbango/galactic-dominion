// Production cycle length — must match the client-side INTERVAL_MS in
// useCycleRefresh.js and ProductionTimer.jsx.
export const CYCLE_MS = 60 * 1000;

// Idempotent cycle counter: how many full production cycles have elapsed
// since lastTick. Both the scheduled tickResources and the client-triggered
// tickMyEmpire use this, so whichever runs first claims the owed cycles and
// the other computes zero — no double-counting.
export function cyclesDue(lastTick, nowMs) {
  if (!lastTick) return 0;
  const lastMs = new Date(lastTick).getTime();
  if (isNaN(lastMs)) return 0;
  const elapsed = nowMs - lastMs;
  if (elapsed < CYCLE_MS) return 0;
  return Math.floor(elapsed / CYCLE_MS);
}