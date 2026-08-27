// Re-export the canonical tech dataset so frontend code can import it via the
// @ alias while backend functions import the same source from base44/shared.
export { TECH_TREE, CATEGORIES, CATEGORY_ORDER, normalizePrereqs, defaultResearchCost, getResearchCost, isPrimaryTech, getUnlocks } from "../../base44/shared/techTree";
export { BASE_TURN_SECONDS, RESEARCH_SPEED_TECH_ID, RESEARCH_SPEED_TECH_BONUS, RESEARCH_SPEED_TIERS, totalResearchSpeedBonus, upgradeBonusFromLevel, nextResearchSpeedTier, computeCompletionMs } from "../../base44/shared/researchSpeed";
export { RESEARCH_POINTS_TIERS, MAX_RESEARCH_POINTS_LEVEL, researchPointsPerCycle, nextResearchPointsTier } from "../../base44/shared/researchPoints";