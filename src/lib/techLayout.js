import { TECH_TREE, CATEGORY_ORDER, normalizePrereqs, isPrimaryTech } from "@/data/techTree";
import { RESEARCH_TEST_MODE } from "../../base44/shared/testMode";

// Research Nexus graph layout. The map now reads like a true technology
// progression: research moves left -> right through tiers, while technologies
// branch vertically. Categories provide the color language rather than rigid
// vertical category columns.
export const NODE_W = 198;
export const PRIMARY_W = 214;
export const NODE_H = 72;
export const NODE_GAP_Y = 14;
export const TIER_W = 300;
export const TIER_GAP = 0;
export const PAD_LEFT = 72;
export const PAD_TOP = 86;
export const PAD_RIGHT = 120;
export const PAD_BOTTOM = 110;

export const CATEGORY_THEME = {
  Defense: {
    accent: '#f59e0b',
    bright: '#fbbf24',
    soft: 'rgba(245,158,11,0.14)',
    line: 'rgba(245,158,11,0.92)',
    icon: 'text-amber-300',
  },
  'Economy and Resources': {
    accent: '#22c55e',
    bright: '#4ade80',
    soft: 'rgba(34,197,94,0.14)',
    line: 'rgba(74,222,128,0.92)',
    icon: 'text-emerald-300',
  },
  'Fleet Research': {
    accent: '#38bdf8',
    bright: '#67e8f9',
    soft: 'rgba(56,189,248,0.14)',
    line: 'rgba(56,189,248,0.92)',
    icon: 'text-sky-300',
  },
  Exploration: {
    accent: '#ef4444',
    bright: '#fb7185',
    soft: 'rgba(239,68,68,0.14)',
    line: 'rgba(248,113,113,0.94)',
    icon: 'text-red-300',
  },
  'Empire Governance': {
    accent: '#a855f7',
    bright: '#c084fc',
    soft: 'rgba(168,85,247,0.14)',
    line: 'rgba(192,132,252,0.92)',
    icon: 'text-violet-300',
  },
  'Blacklisted Alien Technology': {
    accent: '#ec4899',
    bright: '#f472b6',
    soft: 'rgba(236,72,153,0.16)',
    line: 'rgba(244,114,182,0.95)',
    icon: 'text-pink-300',
  },
};

let _layout = null;
const LAYOUT_VERSION = 4;

export function computeLayout(includeHidden = false) {
  if (_layout && _layout.includeHidden === includeHidden && _layout.version === LAYOUT_VERSION) return _layout;

  const visibleTechs = TECH_TREE.filter((t) => includeHidden || !t.hidden);
  const byTier = {};
  const categories = includeHidden
    ? [...CATEGORY_ORDER, ...Object.keys(Object.fromEntries(visibleTechs.map((t) => [t.category, true]))).filter((c) => !CATEGORY_ORDER.includes(c))]
    : CATEGORY_ORDER;

  for (const t of visibleTechs) (byTier[t.tier] ||= []).push(t);

  const maxTier = Math.max(1, ...visibleTechs.map((t) => t.tier));
  const minTier = includeHidden && visibleTechs.some((t) => t.tier === 0) ? 0 : 1;

  // Stable vertical lanes keep the tree readable while allowing each tier to
  // contain several branches. Category order establishes the visual hierarchy.
  const laneBase = {};
  const laneHeight = {};
  let yCursor = PAD_TOP;
  for (const category of categories) {
    const tierCounts = [];
    for (let tier = minTier; tier <= maxTier; tier++) {
      tierCounts.push(visibleTechs.filter((t) => t.category === category && t.tier === tier).length);
    }
    const busiestTier = Math.max(1, ...tierCounts);
    // Every discipline gets a hard vertical boundary and a real gutter.
    // This prevents a newly revealed Blacklisted lane from ever rendering
    // underneath the preceding Empire Governance lane.
    const height = Math.max(142, Math.min(980, busiestTier * (NODE_H + NODE_GAP_Y) + 92));
    laneBase[category] = yCursor;
    laneHeight[category] = height;
    yCursor += height + 28;
  }

  const pos = {};
  const tierGroups = {};
  for (const t of visibleTechs) {
    const tier = Math.max(minTier, t.tier);
    const key = `${t.category}|${tier}`;
    (tierGroups[key] ||= []).push(t);
  }

  for (const t of visibleTechs) {
    const tier = Math.max(minTier, t.tier);
    const group = tierGroups[`${t.category}|${tier}`] || [t];
    const index = group.findIndex((x) => x.id === t.id);
    const total = group.length;
    const blockH = total * NODE_H + Math.max(0, total - 1) * NODE_GAP_Y;
    const laneY = laneBase[t.category];
    const y = laneY + Math.max(24, (laneHeight[t.category] - blockH) / 2) + index * (NODE_H + NODE_GAP_Y);
    const primary = isPrimaryTech(t);
    const w = primary ? PRIMARY_W : NODE_W;
    const x = PAD_LEFT + tier * TIER_W;
    pos[t.id] = { x, y, w, h: NODE_H };
  }

  const worldW = PAD_LEFT + (maxTier + 1) * TIER_W + PAD_RIGHT;
  const worldH = yCursor + PAD_BOTTOM;
  _layout = { pos, worldW, worldH, categories, includeHidden, laneBase, laneHeight, maxTier, minTier, version: LAYOUT_VERSION };
  return _layout;
}

const byId = Object.fromEntries(TECH_TREE.map((t) => [t.id, t]));
export const getTech = (id) => byId[id];

export function getAncestors(id, set = new Set()) {
  const t = byId[id];
  if (!t) return set;
  const { all, any } = normalizePrereqs(t);
  for (const p of [...all, ...any]) {
    if (!set.has(p)) {
      set.add(p);
      getAncestors(p, set);
    }
  }
  return set;
}

export function getDescendants(id, set = new Set()) {
  for (const t of TECH_TREE) {
    const { all, any } = normalizePrereqs(t);
    if ([...all, ...any].includes(id) && !set.has(t.id)) {
      set.add(t.id);
      getDescendants(t.id, set);
    }
  }
  return set;
}

export function deriveStatuses(progressMap) {
  if (RESEARCH_TEST_MODE) return Object.fromEntries(TECH_TREE.map((t) => [t.id, "completed"]));
  const status = {};
  const visiting = new Set();
  const resolve = (techId) => {
    if (status[techId]) return status[techId];
    const t = byId[techId];
    if (!t) return "locked";
    const rec = progressMap[t.id];
    if (rec?.status === "completed") return (status[t.id] = "completed");
    if (rec?.status === "researching") return (status[t.id] = "researching");
    if (visiting.has(t.id)) return "locked";
    visiting.add(t.id);
    const { all, any } = normalizePrereqs(t);
    const allMet = all.every((p) => resolve(p) === "completed");
    const anyMet = any.length === 0 || any.some((p) => resolve(p) === "completed");
    const next = allMet && anyMet ? "available" : "locked";
    visiting.delete(t.id);
    status[t.id] = next;
    return next;
  };
  for (const t of TECH_TREE) resolve(t.id);
  return status;
}

export function getTechnologyState(tech, statusMap) {
  const s = statusMap[tech.id];
  if (tech?.isGate && (s === "available" || s === "completed")) return "researched";
  if (s === "completed") return "researched";
  if (s === "researching") return "researching";
  if (s === "available") return "available";
  return "locked";
}

export function getEdges(includeHidden = false) {
  const edges = [];
  const sourceTechs = TECH_TREE.filter((t) => includeHidden || !t.hidden);
  const sourceIds = new Set(sourceTechs.map((t) => t.id));
  for (const t of sourceTechs) {
    const { all, any } = normalizePrereqs(t);
    for (const p of [...all, ...any]) {
      if (sourceIds.has(p)) edges.push({ from: p, to: t.id, ...(any.includes(p) ? { or: true } : {}) });
    }
  }
  return edges;
}

// Completed incoming paths intentionally disappear. The map's visual energy
// belongs to the research frontier, not to history already conquered.
export function getConnectionState(fromState, toState) {
  if (fromState === "researched" && (toState === "available" || toState === "researching")) return "active";
  if (fromState === "researched" && toState === "locked") return "dormant";
  return "inactive";
}