import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { TECH_TREE, totalResearchSpeedBonus } from '@/data/techTree';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';
import { computeLayout, deriveStatuses, getEdges, getTechnologyState } from '@/lib/techLayout';
import TechCanvas from '@/components/research/TechCanvas';
import TechInfoPanel from '@/components/research/TechInfoPanel';
import TechControls from '@/components/research/TechControls';
import { Loader2 } from 'lucide-react';

// Research Nexus — data-driven technology tree. Loads the shared tech
// dataset and the player's TechProgress records, derives every node's state
// (researched / available / locked / researching) from that data, and renders
// a pannable/zoomable graph. No visual state is hard-coded in the tech data;
// the whole tree repaints automatically when the player's research changes.
export default function Research() {
  const { empire, refresh: refreshEmpire } = useEmpire();
  const [progress, setProgress] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showOnly, setShowOnly] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProgress = useCallback(async () => {
    try {
      const recs = await base44.entities.TechProgress.list('-updated_date', 500);
      const map = {};
      for (const r of recs) map[r.tech_id] = r;
      setProgress(map);
    } catch {
      setProgress({});
    }
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  // Realtime subscription catches completions instantly when the socket
  // delivers them; the production-cycle refresh reloads on each tick rollover
  // so tick-driven completions (service-role writes that don't reach the
  // socket) appear without an independent polling timer.
  useEffect(() => {
    const unsub = base44.entities.TechProgress.subscribe(() => { loadProgress(); });
    return unsub;
  }, [loadProgress]);
  useCycleRefresh(empire?.last_tick_date, loadProgress);

  const statusMap = useMemo(() => (progress ? deriveStatuses(progress) : {}), [progress]);
  const completedIds = useMemo(
    () => new Set(Object.entries(progress || {}).filter(([, r]) => r?.status === 'completed').map(([id]) => id)),
    [progress]
  );
  const speedBonus = useMemo(
    () => (progress ? totalResearchSpeedBonus(completedIds, empire?.research_speed_level || 0) : 0),
    [progress, completedIds, empire]
  );
  const layout = useMemo(() => computeLayout(), []);
  const edges = useMemo(() => getEdges(), []);

  const filteredIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return new Set(TECH_TREE.filter((t) => {
      const st = getTechnologyState(t, statusMap);
      if (showOnly === 'researched' && st !== 'researched') return false;
      if (showOnly === 'available' && !(st === 'available' || st === 'researching')) return false;
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.id.includes(q)) return false;
      return true;
    }).map((t) => t.id));
  }, [search, categoryFilter, showOnly, statusMap]);

  const selected = selectedId ? TECH_TREE.find((t) => t.id === selectedId) : null;

  const beginResearch = async (techId) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('startResearch', { tech_id: techId });
      if (res?.data?.error) { setError(res.data.error); return; }
      await loadProgress();
      await refreshEmpire();
    } catch (e) {
      setError(e?.message || 'Failed to begin research.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!progress) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 pb-24 lg:pb-6">
      <div className="flex flex-col items-center text-center mb-4">
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">Research Nexus</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">
          Chart your empire's technological ascension.
        </p>
      </div>

      <TechControls
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        showOnly={showOnly}
        setShowOnly={setShowOnly}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mt-4">
        <div className="glass-panel-strong rounded-2xl p-2 md:p-3">
          <TechCanvas
            statusMap={statusMap}
            edges={edges}
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            visibleIds={filteredIds}
          />
        </div>
        <div className="hidden lg:block h-full">
          <TechInfoPanel
            tech={selected}
            statusMap={statusMap}
            progress={progress}
            speedBonus={speedBonus}
            submitting={submitting}
            error={error}
            onBeginResearch={beginResearch}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {selected && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 max-h-[62vh] overflow-y-auto glass-panel-strong rounded-t-2xl p-4 border-t border-cyan-400/20">
          <TechInfoPanel
            tech={selected}
            statusMap={statusMap}
            progress={progress}
            speedBonus={speedBonus}
            submitting={submitting}
            error={error}
            onBeginResearch={beginResearch}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}