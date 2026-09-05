// Research Points generation model.
// Research Points are NOT a stored pool. Every empire generates a FIXED base
// amount per hour (BASE_HOURLY_RP), regardless of population. This output only
// grows through:
//   1. Research-speed bonuses (the quantum_computing tech + the purchasable
//      Research Accelerator upgrade levels) — multiplicative.
//   2. Research Point Synthesis upgrade tiers — flat additive RP/hr bonuses.
// Martial Law does not affect Research Points. The hourly output is applied to
// the empire's single active research project by the production tick; unused
// output is not carried forward.
import { totalResearchSpeedBonus } from './researchSpeed.ts';

export const BASE_HOURLY_RP = 50;
export const STARTING_RESEARCH_POINTS = 50;
// Deprecated alias kept for backward-compatible re-exports.
export const RESEARCH_POOL_PER_MILLION_POP = BASE_HOURLY_RP;

// Base hourly research output (fixed, before any bonuses).
export function researchPoolMaximum() {
  return BASE_HOURLY_RP;
}

// Compatibility helper — returns the fixed base hourly output.
export function researchPointsPerHour() {
  return BASE_HOURLY_RP;
}

// Flat RP/hr bonus granted by purchased Research Point Synthesis tiers.
export function researchPointsSynthesisBonus(level = 0) {
  let bonus = 0;
  for (let i = 0; i < Math.min(level, RESEARCH_POINTS_TIERS.length); i++) {
    bonus += RESEARCH_POINTS_TIERS[i].rpHourlyBonus;
  }
  return bonus;
}

// Full hourly research output for an empire: fixed base + synthesis tier
// bonuses, multiplied by research-speed bonuses. `completedIds` is a Set (or
// iterable) of completed tech_id strings (for the quantum_computing bonus);
// `empire.research_speed_level` provides the purchased accelerator bonus.
// Both stack and multiply the base+synthesis rate.
export function researchHourlyRate(empire, completedIds) {
  const level = empire?.research_points_production_level || 0;
  const speedBonus = totalResearchSpeedBonus(completedIds, empire?.research_speed_level || 0);
  return (BASE_HOURLY_RP + researchPointsSynthesisBonus(level)) * (1 + Math.max(0, speedBonus));
}

// Purchasable "Research Point Synthesis" tiers. Each tier grants a flat RP/hr
// bonus (additive to the base rate). Martial Law does not affect Research Points.
export const RESEARCH_POINTS_TIERS = [
  { level: 1, rpHourlyBonus: 25, cost: { aetherium_crystal: 400, ferrite_titanium: 800, energy: 300, vrind: 600, berentium: 200 } },
  { level: 2, rpHourlyBonus: 50, cost: { aetherium_crystal: 1000, ferrite_titanium: 2000, energy: 800, vrind: 1500, berentium: 500 } },
  { level: 3, rpHourlyBonus: 100, cost: { aetherium_crystal: 2500, ferrite_titanium: 5000, energy: 2000, vrind: 4000, berentium: 1000 } },
];
export const MAX_RESEARCH_POINTS_LEVEL = RESEARCH_POINTS_TIERS.length;

export function nextResearchPointsTier(level) {
  const next = (level || 0) + 1;
  return RESEARCH_POINTS_TIERS[next - 1] || null;
}