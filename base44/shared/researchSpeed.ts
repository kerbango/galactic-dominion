// Research-speed model — shared by frontend and backend. Research completion
// is time-based: a record completes when
//   now >= start_date + research_turns * BASE_TURN_SECONDS * (1 - totalBonus)
// The total bonus stacks from two sources: a base bonus granted by completing
// a designated research tech, plus a purchasable tiered upgrade stored on the
// Empire (research_speed_level). Both apply dynamically, so buying the
// upgrade (or completing the tech) immediately shortens any in-progress
// research — the finish line is recomputed from the live bonus every check.

// Seconds of real time per research turn. This is INDEPENDENT of the
// scheduled tick cadence: lengthening the ResourceTick cron changes only how
// often completions are scanned for, not how long a turn takes.
export const BASE_TURN_SECONDS = 300;

// Completing this tech grants the base research-speed bonus. The tech also
// lists the ability in its `unlocks` entry so it shows in the info panel.
export const RESEARCH_SPEED_TECH_ID = "quantum_computing";
export const RESEARCH_SPEED_TECH_BONUS = 0.10;

// Purchasable upgrade tiers. `bonus` is the TOTAL bonus at that level (not
// additive per purchase), so level 2 = +20% total, not +10% then +20%.
export const RESEARCH_SPEED_TIERS = [
  { level: 1, bonus: 0.10, cost: { aetherium_crystal: 400, ferrite_titanium: 800, energy: 300, vrind: 600 } },
  { level: 2, bonus: 0.20, cost: { aetherium_crystal: 1000, ferrite_titanium: 2000, energy: 800, vrind: 1500 } },
  { level: 3, bonus: 0.30, cost: { aetherium_crystal: 2500, ferrite_titanium: 5000, energy: 2000, vrind: 4000 } },
];
export const MAX_RESEARCH_SPEED_LEVEL = RESEARCH_SPEED_TIERS.length;

// Bonus contributed by the purchased upgrade level (0 when none bought).
export function upgradeBonusFromLevel(level) {
  if (!level || level <= 0) return 0;
  const tier = RESEARCH_SPEED_TIERS[level - 1];
  return tier ? tier.bonus : 0;
}

// The next tier available to purchase after `level`, or null if maxed.
export function nextResearchSpeedTier(level) {
  const next = (level || 0) + 1;
  return RESEARCH_SPEED_TIERS[next - 1] || null;
}

// Total research-speed bonus for a player. `completedTechIds` is a Set (or
// iterable) of tech_id strings the player has completed; `level` is their
// stored upgrade level. Both sources stack.
export function totalResearchSpeedBonus(completedTechIds, level) {
  const set = completedTechIds instanceof Set ? completedTechIds : new Set(completedTechIds || []);
  const base = set.has(RESEARCH_SPEED_TECH_ID) ? RESEARCH_SPEED_TECH_BONUS : 0;
  return base + upgradeBonusFromLevel(level);
}

// Completion timestamp (ms) for a research record started at startMs.
export function computeCompletionMs(startMs, researchTurns, totalBonus) {
  const turns = Math.max(1, researchTurns || 1);
  const bonus = Math.min(0.9, Math.max(0, totalBonus || 0));
  return startMs + turns * BASE_TURN_SECONDS * 1000 * (1 - bonus);
}