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

// Martial law grants a 5x multiplier on production while active. Returns the
// per-empire multiplier to apply to a tick's granted amount at tick time, so
// only empires with an active martial law window get the boost.
export const MARTIAL_LAW_MULTIPLIER = 5;
export function martialLawMultiplier(empire, nowMs) {
  if (!empire || !empire.martial_law_active_until) return 1;
  const until = new Date(empire.martial_law_active_until).getTime();
  if (isNaN(until)) return 1;
  return nowMs < until ? MARTIAL_LAW_MULTIPLIER : 1;
}