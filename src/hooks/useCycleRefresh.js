import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// Must match the production-cycle length in ProductionTimer.jsx.
const INTERVAL_MS = 60 * 1000;

// Detects when the production-cycle countdown rolls over (hits zero) and
// immediately refetches the empire so freshly-ticked totals appear. If the
// server tick hasn't landed yet (last_tick_date unchanged), retries a few
// seconds later until the new totals arrive.
export function useCycleRefresh(lastTick, onRefreshed) {
  const lastCycleRef = useRef(null);
  const retryRef = useRef(null);
  const lastTickRef = useRef(lastTick);
  const onRefreshedRef = useRef(onRefreshed);

  useEffect(() => { lastTickRef.current = lastTick; }, [lastTick]);
  useEffect(() => { onRefreshedRef.current = onRefreshed; }, [onRefreshed]);

  async function refresh() {
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
    try {
      const user = await base44.auth.me();
      const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
      const fresh = empires[0] || null;
      if (fresh && lastTickRef.current && fresh.last_tick_date === lastTickRef.current) {
        retryRef.current = setTimeout(refresh, 3000);
        return;
      }
      onRefreshedRef.current(fresh);
    } catch (e) { /* ignore — next rollover/poll will retry */ }
  }

  useEffect(() => {
    if (!lastTick) return;
    const check = () => {
      const now = Date.now();
      const lastMs = new Date(lastTickRef.current).getTime();
      const cycle = Math.floor((now - lastMs) / INTERVAL_MS);
      if (lastCycleRef.current != null && cycle > lastCycleRef.current) {
        refresh();
      }
      lastCycleRef.current = cycle;
    };
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [lastTick]);

  useEffect(() => () => { if (retryRef.current) clearTimeout(retryRef.current); }, []);
}