import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { TECH_TREE, totalResearchSpeedBonus } from '@/data/techTree';
import { useCycleRefresh } from '@/hooks/useCycleRefresh';
import { computeLayout, deriveStatuses, getEdges, getTechnologyState } from '@/lib/techLayout';
import TechCanvas from '@/components/research/TechCanvas';
import TechInfoPanel from '@/components/research/TechInfoPanel';
import TechControls from '@/components/research/TechControls';
import ActiveResearchPanel from '@/components/research/ActiveResearchPanel';
import { Loader2, Microscope } from 'lucide-react';
import { BASE_TURN_SECONDS } from '@/data/techTree';
import { formatDuration } from '@/lib/galaxy';
import { toastSuccess } from '@/lib/toasts';
import { RESEARCH_TEST_MODE } from '../../base44/shared/testMode';

// Research Nexus — data-driven technology tree. This page intentionally keeps
// the existing research state, prerequisites, unlocks, and server actions
// intact while presenting them as a dedicated sci-fi command interface.
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
  useEffect(() => {
    const unsub = base44.entities.TechProgress.subscribe(() => { loadProgress(); });
    return unsub;
  }, [loadProgress]);
  useCycleRefresh(empire?.last_tick_date, loadProgress);

  const statusMap = useMemo(() => (progress ? deriveStatuses(progress) : {}), [progress]);
  const completedIds = useMemo(
    () => RESEARCH_TEST_MODE
      ? new Set(TECH_TREE.map((t) => t.id))
      : new Set(Object.entries(progress || {}).filter(([, r]) => r?.status === 'completed').map(([id]) => id)),
    [progress]
  );
  const blacklistedUnlocked = useMemo(
    () => completedIds.has('relic_adhesion_matrix_ai') && completedIds.has('empire_control_overlord'),
    [completedIds]
  );
  const visibleTechTree = useMemo(
    () => TECH_TREE.filter((t) => !t.hidden || blacklistedUnlocked),
    [blacklistedUnlocked]
  );
  const speedBonus = useMemo(
    () => (progress ? totalResearchSpeedBonus(completedIds, empire?.research_speed_level || 0) : 0),
    [progress, completedIds, empire]
  );
  const layout = useMemo(() => computeLayout(blacklistedUnlocked), [blacklistedUnlocked]);
  const edges = useMemo(() => getEdges(blacklistedUnlocked), [blacklistedUnlocked]);

  useEffect(() => {
    if (selectedId && !visibleTechTree.some((t) => t.id === selectedId)) setSelectedId(null);
  }, [selectedId, visibleTechTree]);

  const filteredIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return new Set(visibleTechTree.filter((t) => {
      const st = getTechnologyState(t, statusMap);
      if (showOnly === 'researched' && st !== 'researched') return false;
      if (showOnly === 'available' && !(st === 'available' || st === 'researching')) return false;
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.id.includes(q)) return false;
      return true;
    }).map((t) => t.id));
  }, [search, categoryFilter, showOnly, statusMap, visibleTechTree]);

  const selected = selectedId ? visibleTechTree.find((t) => t.id === selectedId) : null;

  const beginResearch = async (techId) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('startResearch', { tech_id: techId });
      if (res?.data?.error) { setError(res.data.error); return; }
      const tech = TECH_TREE.find((t) => t.id === techId);
      const turns = res?.data?.record?.research_turns || tech?.researchTurns || 1;
      const completionSec = turns * BASE_TURN_SECONDS * (1 - speedBonus);
      toastSuccess('RESEARCH STARTED', `${tech?.name || techId} · completes in ${formatDuration(completionSec)}`);
      if (res?.data?.record) {
        setProgress((current) => ({ ...current, [res.data.record.tech_id]: res.data.record }));
      }
      await refreshEmpire(res?.data?.empire);
      await loadProgress();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to begin research.');
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
    <div className="min-h-screen bg-[#02070d] text-slate-100">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-3 lg:py-4 pb-20">
        <header className="relative overflow-hidden rounded-xl border border-cyan-400/20 bg-[#06111d]/90 shadow-[0_0_35px_rgba(8,145,178,0.08)]">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(34,211,238,0.06),transparent_35%,rgba(14,165,233,0.04))]" />
          <div className="relative flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                <Microscope className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h1 className="font-heading text-xl md:text-2xl tracking-[0.12em] text-white uppercase">Research Nexus</h1>
                <p className="text-[9px] md:text-[10px] font-mono tracking-[0.2em] uppercase text-cyan-300/60">Advance your empire · secure your dominion</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-5 text-right">
              <div><p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Research Points</p><p className="font-mono text-sm text-cyan-200">{Math.floor(empire?.research_points || 0).toLocaleString()}</p></div>
              <div><p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Research Speed</p><p className="font-mono text-sm text-emerald-300">+{Math.round(speedBonus * 100)}%</p></div>
              <div><p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Research Slots</p><p className="font-mono text-sm text-amber-300">{Math.min(2, Math.max(1, empire?.parallel_research_level >= 1 ? 2 : 1))}</p></div>
            </div>
          </div>
        </header>

        <div className="mt-2"><ActiveResearchPanel /></div>

        <div className="mt-2">
          <TechControls
            search={search}
            setSearch={setSearch}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            showOnly={showOnly}
            setShowOnly={setShowOnly}
            includeHiddenCategory={blacklistedUnlocked}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_310px] gap-2 mt-2">
          <div className="relative overflow-hidden rounded-xl border border-cyan-400/20 bg-[#030b13] shadow-[inset_0_0_50px_rgba(8,47,73,0.25)]">
            <TechCanvas statusMap={statusMap} edges={edges} layout={layout} selectedId={selectedId} onSelect={setSelectedId} visibleIds={filteredIds} />
          </div>
          <div className="hidden lg:block min-h-[620px]">
            <TechInfoPanel tech={selected} statusMap={statusMap} progress={progress} speedBonus={speedBonus} submitting={submitting} error={error} onBeginResearch={beginResearch} onClose={() => setSelectedId(null)} />
          </div>
        </div>

        {selected && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 max-h-[68vh] overflow-y-auto rounded-t-2xl border-t border-cyan-400/30 bg-[#06111d]/98 p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.55)]">
            <TechInfoPanel tech={selected} statusMap={statusMap} progress={progress} speedBonus={speedBonus} submitting={submitting} error={error} onBeginResearch={beginResearch} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}