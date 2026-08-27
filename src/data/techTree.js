// Re-export the canonical tech dataset so frontend code can import it via the
// @ alias while backend functions import the same source from base44/shared.
export { TECH_TREE, CATEGORIES, CATEGORY_ORDER, normalizePrereqs, defaultResearchCost, getResearchCost, isPrimaryTech, getUnlocks } from "../../base44/shared/techTree";