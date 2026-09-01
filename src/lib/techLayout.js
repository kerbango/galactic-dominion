import { TECH_TREE, CATEGORY_ORDER, normalizePrereqs, isPrimaryTech } from "@/data/techTree";

// Auto-layout constants. Nodes are arranged in a grid: tiers advance
// left-to-right, categories occupy vertical bands, and multiple techs in the
// same category+tier stack vertically. No x/y is hard-coded per tech.
export const NODE_W = 210;
export const SUPPORT_W = 176;
export const NODE_H = 76;
export const NODE_GAP_Y = 14;
export const COL_W = 270;
export const BAND_PAD = 44;
export const PAD_LEFT = 64;
export const PAD_TOP = 56;

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
  let y = PAD_TOP;
  for (const cat of categories) {
    catBase[cat] = y;
    const techs = byCat[cat] || [];
    const perTier = {};
    for (const t of techs) perTier[t.tier] = (perTier[t.tier] || 0) + 1;
    const maxStack = Math.max(1, ...Object.values(perTier));
    const bandH = maxStack * (NODE_H + NODE_GAP_Y) + BAND_PAD;
    y += bandH;
  }
  const worldH = y + PAD_TOP;

  const maxTier = Math.max(1, ...visibleTechs.map((t) => t.tier));
  const worldW = maxTier * COL_W + PAD_LEFT * 2;

  const pos = {};
  const stackIdx = {};
  for (const t of visibleTechs) {
    const key = t.category + "|" + t.tier;
    const i = stackIdx[key] || 0;
    stackIdx[key] = i + 1;
    pos[t.id] = {
      x: PAD_LEFT + Math.max(0, t.tier - 1) * COL_W,
      y: catBase[t.category] + BAND_PAD / 2 + i * (NODE_H + NODE_GAP_Y),
      w: isPrimaryTech(t) ? NODE_W : SUPPORT_W,
      h: NODE_H,
    };
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

// Derive each tech's effective status from persisted progress records.
// 'available' is implicit when all prerequisites are completed and no
// researching/completed record exists. Supports AND (all) and OR (any)
// prerequisite groups. Sorted so prerequisites resolve before dependents.
export function deriveStatuses(progressMap) {
  const sorted = [...TECH_TREE].sort((a, b) => a.tier - b.tier);
  const status = {};
  for (const t of sorted) {
    const rec = progressMap[t.id];
    if (rec?.status === "completed") {
      status[t.id] = "completed";
      continue;
    }
    if (rec?.status === "researching") {
      status[t.id] = "researching";
      continue;
    }
    const { all, any } = normalizePrereqs(t);
    const allMet = all.every((p) => status[p] === "completed");
    const anyMet = any.length === 0 || any.some((p) => status[p] === "completed");
    status[t.id] = allMet && anyMet ? "available" : "locked";
  }
  return status;
}

export function getTechnologyState(tech, statusMap) {
  const s = statusMap[tech.id];
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
