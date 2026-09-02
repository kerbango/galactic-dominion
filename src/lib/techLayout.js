import { TECH_TREE, CATEGORY_ORDER, normalizePrereqs, isPrimaryTech } from "@/data/techTree";
import { RESEARCH_TEST_MODE } from "../../base44/shared/testMode";

// Strategic research map: categories are columns and research tiers progress
// downward. This keeps each discipline visually self-contained while making
// the full tree readable without the previous giant stacked category wall.
export const NODE_W = 210;
export const SUPPORT_W = 176;
export const NODE_H = 76;
export const NODE_GAP_Y = 14;
export const CATEGORY_W = 380;
export const TIER_H = 96;
export const TIER_GAP = 18;
export const ROW_CAPACITY = 2;
export const PAD_LEFT = 34;
export const PAD_TOP = 72;
export const BAND_PAD = 24;

let _layout = null;

export function computeLayout(includeHidden = false) {
  if (_layout && _layout.includeHidden === includeHidden) return _layout;
  const visibleTechs = TECH_TREE.filter((t) => includeHidden || !t.hidden);
  const byCat = {};
  for (const t of visibleTechs) (byCat[t.category] ||= []).push(t);
  const categories = includeHidden
    ? [...CATEGORY_ORDER, ...Object.keys(byCat).filter((c) => !CATEGORY_ORDER.includes(c))]
    : CATEGORY_ORDER;
  const catBase = {};
  categories.forEach((cat, index) => { catBase[cat] = PAD_LEFT + index * CATEGORY_W; });
  const maxTier = Math.max(1, ...visibleTechs.map((t) => t.tier));
  // Each tier row expands only as much as its busiest category needs. Nodes
  // use a two-column grid inside each discipline, preventing wide branches
  // (such as Empire Governance tier 4) from overlapping or escaping the lane.
  const tierHeights = {};
  for (let tier = 1; tier <= maxTier; tier++) {
    const maxCount = Math.max(1, ...categories.map((cat) => (byCat[cat] || []).filter((t) => t.tier === tier).length));
    const rows = Math.ceil(maxCount / ROW_CAPACITY);
    tierHeights[tier] = Math.max(TIER_H, rows * NODE_H + Math.max(0, rows - 1) * NODE_GAP_Y + TIER_GAP * 2);
  }
  const tierTop = {};
  let cursorY = PAD_TOP;
  for (let tier = 1; tier <= maxTier; tier++) {
    tierTop[tier] = cursorY;
    cursorY += tierHeights[tier];
  }
  const worldW = categories.length * CATEGORY_W + PAD_LEFT * 2;
  const worldH = cursorY + PAD_TOP;
  const pos = {};
  const stackIdx = {};
  for (const t of visibleTechs) {
    const key = t.category + "|" + t.tier;
    const i = stackIdx[key] || 0;
    stackIdx[key] = i + 1;
    const primary = isPrimaryTech(t);
    const categoryIndex = Math.max(0, categories.indexOf(t.category));
    const tier = Math.max(1, t.tier);
    const rowCount = Math.ceil(((byCat[t.category] || []).filter((x) => x.tier === tier).length) / ROW_CAPACITY);
    const row = Math.floor(i / ROW_CAPACITY);
    const col = i % ROW_CAPACITY;
    const nodeWidth = primary ? NODE_W : SUPPORT_W;
    const cellW = (CATEGORY_W - 30) / ROW_CAPACITY;
    const cellLeft = PAD_LEFT + categoryIndex * CATEGORY_W + 15 + col * cellW;
    const x = cellLeft + (cellW - nodeWidth) / 2;
    const contentH = rowCount * NODE_H + Math.max(0, rowCount - 1) * NODE_GAP_Y;
    const y = tierTop[tier] + (tierHeights[tier] - contentH) / 2 + row * (NODE_H + NODE_GAP_Y);
    pos[t.id] = { x, y, w: nodeWidth, h: NODE_H };
  }
  _layout = { pos, worldW, worldH, catBase, includeHidden };
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
  if (RESEARCH_TEST_MODE) {
    return Object.fromEntries(TECH_TREE.map((t) => [t.id, "completed"]));
  }
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
  // Gate technologies are automatic unlock markers, never research purchases.
  // Once their prerequisites are met, present them as completed rather than
  // offering a misleading Begin Research action.
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

export function getConnectionState(fromState, toState) {
  if (fromState === "researched" && toState === "researched") return "completed";
  if (fromState === "researched" && (toState === "available" || toState === "researching")) return "active";
  if (fromState === "researched" && toState === "locked") return "dormant";
  return "inactive";
}
