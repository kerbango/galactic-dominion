import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { deriveStatuses, getTech } from "@/lib/techLayout";
import TechTreeCanvas from "@/components/research/TechTreeCanvas";
import TechInfoPanel from "@/components/research/TechInfoPanel";
import { Loader2, Menu, X, FlaskConical } from "lucide-react";

export default function Research() {
  const [loading, setLoading] = useState(true);
  const [hasEmpire, setHasEmpire] = useState(true);
  const [progressMap, setProgressMap] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
        if (!active) return;
        if (!empires.length) { setHasEmpire(false); setLoading(false); return; }
        const records = await base44.entities.TechProgress.list("-created_date", 500);
        if (!active) return;
        const map = {};
        for (const r of records) map[r.tech_id] = r;
        setProgressMap(map);
      } catch {
        // ignore — statuses fall back to all-locked/available defaults
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const unsub = base44.entities.TechProgress.subscribe((event) => {
      setProgressMap((prev) => {
        const next = { ...prev };
        const r = event.data;
        if (!r) return prev;
        if (event.type === "delete") delete next[r.tech_id];
        else next[r.tech_id] = r;
        return next;
      });
    });
    return unsub;
  }, []);

  const statuses = useMemo(() => deriveStatuses(progressMap), [progressMap]);
  const selected = selectedId ? getTech(selectedId) : null;
  const researchingId = Object.values(progressMap).find((r) => r.status === "researching")?.tech_id || null;

  const handleResearch = async () => {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("startResearch", { tech_id: selectedId });
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to start research.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
      </div>
    );
  }
  if (!hasEmpire) return <Navigate to="/setup" replace />;

  return (
    <div className="flex flex-col h-[calc(100svh-8.5rem)]">
      {/* Fixed research header */}
      <div className="shrink-0 flex items-center justify-between px-4 md:px-8 py-3 border-b border-cyan-400/15 glass-panel-strong rounded-t-xl mb-2">
        <Link to="/console" className="flex items-center gap-2 text-muted-foreground hover:text-cyan-200 transition-colors">
          <Menu className="w-5 h-5" />
          <span className="font-mono text-[10px] uppercase tracking-widest hidden sm:inline">Menu</span>
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-cyan-300" />
          <h1 className="font-heading text-base md:text-lg tracking-[0.3em] text-cyan-100 neon-text uppercase">
            Choose Research
          </h1>
        </div>
        <Link to="/console" className="flex items-center gap-2 text-muted-foreground hover:text-rose-300 transition-colors">
          <span className="font-mono text-[10px] uppercase tracking-widest hidden sm:inline">Close</span>
          <X className="w-5 h-5" />
        </Link>
      </div>

      {/* Canvas + info panel */}
      <div className="relative flex-1 min-h-0 glass-panel-strong rounded-xl overflow-hidden">
        <TechTreeCanvas statuses={statuses} progressMap={progressMap} onSelect={(t) => { setSelectedId(t.id); setError(""); }} />
        {selected && (
          <TechInfoPanel
            tech={selected}
            statuses={statuses}
            progress={progressMap[selected.id]?.progress}
            researchingId={researchingId}
            busy={busy}
            error={error}
            onClose={() => setSelectedId(null)}
            onResearch={handleResearch}
          />
        )}
      </div>
    </div>
  );
}