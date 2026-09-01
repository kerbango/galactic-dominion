// Re-export the runtime research tree so frontend code uses the same corrected
// research-to-upgrade mapping as the backend research endpoint.
export { TECH_TREE, CATEGORIES, CATEGORY_ORDER, normalizePrereqs, defaultResearchCost, getResearchCost, isPrimaryTech, getUnlocks } from "../../base44/shared/techTreeRuntime";
export { BASE_TURN_SECONDS, RESEARCH_SPEED_TECH_ID, RESEARCH_SPEED_TECH_BONUS, RESEARCH_SPEED_TIERS, totalResearchSpeedBonus, upgradeBonusFromLevel, nextResearchSpeedTier, computeCompletionMs } from "../../base44/shared/researchSpeed";
export { RESEARCH_POINTS_TIERS, MAX_RESEARCH_POINTS_LEVEL, researchPointsPerCycle, nextResearchPointsTier } from "../../base44/shared/researchPoints";
