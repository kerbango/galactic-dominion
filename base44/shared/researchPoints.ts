// Research Points generation model.
// Research Points are NOT a stored pool. The empire generates a fixed amount
// per hour, derived from population (500 RP/hr per million population) and
// multiplied by research-speed bonuses (the quantum_computing tech and the
// purchasable Research Accelerator upgrade levels). The hourly output is
// applied to the empire's single active research project by the production
// tick; unused output is not carried forward.
import { totalResearchSpeedBonus } from './researchSpeed.ts';

export const RESEARCH_POOL_PER_MILLION_POP = 500;
export const STARTING_RESEARCH_POINTS = 500;

// Base hourly research output from population alone, before speed bonuses.
// 500 RP/hr per million population.
export function researchPoolMaximum(population) {
  const pop = Math.max(0, Number(population) || 0);
  return Math.max(1, Math.floor((pop / 1_000_000) * RESEARCH_POOL_PER_MILLION_POP));
}

// Compatibility helper for older callers. Represents the base hourly research
// output from population (before speed bonuses).
export function researchPointsPerHour(population) {
  return researchPoolMaximum(population);
}

// Full hourly research output for an empire, including research-speed
// bonuses. `completedIds` is a Set (or iterable) of completed tech_id strings
// (for the quantum_computing bonus); `empire.research_speed_level` provides
// the purchased upgrade bonus. Both stack and multiply the base rate.
export function researchHourlyRate(empire, completedIds) {
  const pop = empire?.population || 0;
  const speedBonus = totalResearchSpeedBonus(completedIds, empire?.research_speed_level || 0);
  return researchPointsPerHour(pop) * (1 + Math.max(0, speedBonus));
}

// Purchasable "Research Point Synthesis" tiers. Each tier grants a flat
// population bonus (indirectly raising RP/hr since the base rate scales with
// population). Martial Law does not affect Research Points.
export const RESEARCH_POINTS_TIERS = [
  { level: 1, populationBonus: 500_000, cost: { aetherium_crystal: 400, ferrite_titanium: 800, energy: 300, vrind: 600, berentium: 200 } },
  { level: 2, populationBonus: 1_000_000, cost: { aetherium_crystal: 1000, ferrite_titanium: 2000, energy: 800, vrind: 1500, berentium: 500 } },
  { level: 3, populationBonus: 2_000_000, cost: { aetherium_crystal: 2500, ferrite_titanium: 5000, energy: 2000, vrind: 4000, berentium: 1000 } },
];
export const MAX_RESEARCH_POINTS_LEVEL = RESEARCH_POINTS_TIERS.length;

export function nextResearchPointsTier(level) {
  const next = (level || 0) + 1;
  return RESEARCH_POINTS_TIERS[next - 1] || null;
}