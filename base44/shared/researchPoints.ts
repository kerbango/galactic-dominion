// Research Points are a renewable pool whose capacity is determined by
// population. Research allocation, not this module, determines how the pool
// is invested into active technologies.
export const RESEARCH_POOL_PER_MILLION_POP = 500;
export const STARTING_RESEARCH_POINTS = 500;

export function researchPoolMaximum(population) {
  const pop = Math.max(0, Number(population) || 0);
  return Math.max(1, Math.floor((pop / 1_000_000) * RESEARCH_POOL_PER_MILLION_POP));
}

// Purchasable "Research Point Synthesis" tiers. Each tier grants a flat
// population bonus (indirectly raising RP/hr since RP capacity scales with
// population). Martial Law does not affect Research Points.
export const RESEARCH_POINTS_TIERS = [
  { level: 1, populationBonus: 500_000, cost: { aetherium_crystal: 400, ferrite_titanium: 800, energy: 300, vrind: 600, berentium: 200 } },
  { level: 2, populationBonus: 1_000_000, cost: { aetherium_crystal: 1000, ferrite_titanium: 2000, energy: 800, vrind: 1500, berentium: 500 } },
  { level: 3, populationBonus: 2_000_000, cost: { aetherium_crystal: 2500, ferrite_titanium: 5000, energy: 2000, vrind: 4000, berentium: 1000 } },
];
export const MAX_RESEARCH_POINTS_LEVEL = RESEARCH_POINTS_TIERS.length;

// The next tier available to purchase after `level`, or null if maxed.
export function nextResearchPointsTier(level) {
  const next = (level || 0) + 1;
  return RESEARCH_POINTS_TIERS[next - 1] || null;
}

// Kept as a compatibility helper for older callers. It now represents the
// maximum pool replenished in one hour rather than a per-cycle production rate.
export function researchPointsPerHour(population) {
  return researchPoolMaximum(population);
}