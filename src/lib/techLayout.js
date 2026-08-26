import { TECH_TREE, CATEGORY_ORDER } from "@/data/techTree";

// Auto-layout constants. Nodes are arranged in a grid: tiers advance
// left-to-right, categories occupy vertical bands, and multiple techs in the
// same category+tier stack vertically. No x/y is hard-coded per tech.
export const NODE_W = 212;
export const NODE_H = 88;
export const NODE_GAP_Y = 16;
export const COL_W = 300;
export const BAND_PAD = 44;
export const PAD_LEFT = 64;
export const PAD_TOP = 56;

let _layout = null;

export function computeLayout() {
  if (_layout) return _layout;

  const byCat = {};
  for (const t of TECH_TREE) {
    (byCat[t.category] ||= []).push(t);
  }

  const catBase = {};
  let y = PAD_TOP;
  for (const cat of CATEGORY_ORDER) {
    catBase[cat] = y;
    const techs = byCat[cat] || [];
    const perTier = {};
    for (const t of techs) perTier[t.tier] = (perTier[t.tier] || 0) + 1;
    const maxStack = Math.max(1, ...Object.values(perTier));
    const bandH = maxStack * (NODE_H + NODE_GAP_Y) + BAND_PAD;
    y += bandH;
  }
  const worldH = y + PAD_TOP;

  const maxTier = Math.max(...TECH_TREE.map((t) => t.tier));
  const worldW = maxTier * COL_W + PAD_LEFT * 2;

  const pos = {};
  const stackIdx = {};
  for (const t of TECH_TREE) {
    const key = t.category + "|" + t.tier;
    const i = stackIdx[key] || 0;
    stackIdx[key] = i + 1;
    pos[t.id] = {
      x: PAD_LEFT + (t.tier - 1) * COL_W,
      y: catBase[t.category] + BAND_PAD / 2 + i * (NODE_H + NODE_GAP_Y),
      w: NODE_W,
      h: NODE_H,
    };
  }

  _layout = { pos, worldW, worldH, catBase };
  return _layout;
}

const byId = Object.fromEntries(TECH_TREE.map((t) => [t.id, t]));
export const getTech = (id) => byId[id];

export function getAncestors(id, set = new Set()) {
  const t = byId[id];
  if (!t) return set;
  for (const p of t.prerequisites || []) {
    if (!set.has(p)) {
      set.add(p);
      getAncestors(p, set);
    }
  }
  return set;
}

export function getDescendants(id, set = new Set()) {
  for (const t of TECH_TREE) {
    if ((t.prerequisites || []).includes(id) && !set.has(t.id)) {
      set.add(t.id);
      getDescendants(t.id, set);
    }
  }
  return set;
}

// Derive each tech's effective status from persisted progress records.
// 'available' is implicit when all prerequisites are completed and no
// researching/completed record exists. Sorted by tier so prerequisites
// resolve before dependents.
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
    const allMet = (t.prerequisites || []).every((p) => status[p] === "completed");
    status[t.id] = allMet ? "available" : "locked";
  }
  return status;
}