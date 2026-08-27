import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Shared empire store. Loads the current user's empire once and exposes a
// refresh() that refetches from the server. All trade actions call refresh()
// after they resolve so treasury values update instantly across every screen
// (Console, Profile, Market) without relying on the realtime subscription,
// which does not fire for service-role writes.
const EmpireContext = createContext({ empire: null, loading: true, refresh: async () => {} });

export function EmpireProvider({ children }) {
  const { user, isLoadingAuth } = useAuth();
  const [empire, setEmpire] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      if (!me) { setEmpire(null); return; }
      const empires = await base44.entities.Empire.filter({ created_by_id: me.id });
      setEmpire(empires[0] || null);
    } catch {
      setEmpire(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On first load, grant any production cycles the player earned while
  // offline so the treasury shows accumulated totals immediately — instead
  // of waiting up to a minute for useCycleRefresh's rollover. tickMyEmpire is
  // idempotent per cycle (cyclesDue), so this can't double-count with the
  // scheduled tickResources workflow.
  useEffect(() => {
    if (isLoadingAuth) return;
    let cancelled = false;
    (async () => {
      await refresh();
      try {
        const res = await base44.functions.invoke('tickMyEmpire', {});
        if (cancelled) return;
        const fresh = res.data?.empire;
        if (fresh) setEmpire(fresh);
      } catch {
        /* no empire yet, or tick not due — next cycle refresh will retry */
      }
    })();
    return () => { cancelled = true; };
  }, [isLoadingAuth, user?.id, refresh]);

  // Realtime subscription as a secondary signal: merge updates into the
  // shared store so screens reflect other-user or same-user writes that do
  // reach the socket, without fighting the explicit refresh() calls.
  useEffect(() => {
    const unsubscribe = base44.entities.Empire.subscribe((event) => {
      if (event.type === 'update' && event.data) {
        setEmpire((prev) => (prev && prev.id === event.data.id ? { ...prev, ...event.data } : prev));
      }
    });
    return unsubscribe;
  }, []);

  return (
    <EmpireContext.Provider value={{ empire, loading, refresh }}>
      {children}
    </EmpireContext.Provider>
  );
}

export function useEmpire() {
  return useContext(EmpireContext);
}