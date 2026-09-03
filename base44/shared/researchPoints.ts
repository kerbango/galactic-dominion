// Research Points production model — shared by frontend and backend.
// Research Points are produced at a rate of 1 per hour per 100,000 population.
// 1M population = 10 RP/hr. Population is driven only by Governance-tree
// upgrades (Population Growth I/II/III and the repurposed Research Point
// Synthesis tiers below), making the Governance branch the sole driver of
// long-term research output. Martial Law does NOT apply to Research Points.

// Repurposed "Research Point Synthesis" tiers. Each tier now grants a flat
// population boost instead of an RP-per-cycle bonus. The same resource costs
// are retained.
export const RESEARCH_POINTS_TIERS = [
  { level: 1, populationBonus: 500_000,  cost: { aetherium_crystal: 400,  ferrite_titanium: 800,  energy: 300,  vrind: 600 } },
  { level: 2, populationBonus: 1_000_000, cost: { aetherium_crystal: 1000, ferrite_titanium: 2000, energy: 800,  vrind: 1500 } },
  { level: 3, populationBonus: 2_000_000, cost: { aetherium_crystal: 2500, ferrite_titanium: 5000, energy: 2000, vrind: 4000 } },
];
export const MAX_RESEARCH_POINTS_LEVEL = RESEARCH_POINTS_TIERS.length;

// Research Points produced per hour at a given population.
export function researchPointsPerHour(population) {
  const pop = Math.max(0, Number(population) || 0);
  return Math.floor(pop / 100_000);
}

// The next tier available to purchase after `level`, or null if maxed.
export function nextResearchPointsTier(level) {
  const next = (Number(level) || 0) + 1;
  return RESEARCH_POINTS_TIERS[next - 1] || null;
}