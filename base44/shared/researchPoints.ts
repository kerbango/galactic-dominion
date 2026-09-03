// Research Points are a renewable pool whose capacity is determined by
// population. Research allocation, not this module, determines how the pool
// is invested into active technologies.
export const RESEARCH_POOL_PER_MILLION_POP = 500;
export const STARTING_RESEARCH_POINTS = 500;

export function researchPoolMaximum(population) {
  const pop = Math.max(0, Number(population) || 0);
  return Math.max(1, Math.floor((pop / 1_000_000) * RESEARCH_POOL_PER_MILLION_POP));
}

// Kept as a compatibility helper for older callers. It now represents the
// maximum pool replenished in one hour rather than a per-cycle production rate.
export function researchPointsPerHour(population) {
  return researchPoolMaximum(population);
}
