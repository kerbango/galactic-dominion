// Research Points production model — shared by frontend and backend.
// Research Points are a currency produced each production cycle (like the
// other resources) and spent alongside VRIND to start research. The base rate
// is 1 per cycle; each purchased upgrade tier adds +1 per cycle, so level L
// produces (1 + L) Research Points per cycle. Martial Law's multiplier
// applies on top, consistent with every other resource.

// Purchasable upgrade tiers. `bonus` is the extra Research Points per cycle
// granted at that level (so total per cycle = 1 + bonus = 1 + level).
export const RESEARCH_POINTS_TIERS = [
  { level: 1, bonus: 1, cost: { aetherium_crystal: 400, ferrite_titanium: 800, energy: 300, vrind: 600 } },
  { level: 2, bonus: 2, cost: { aetherium_crystal: 1000, ferrite_titanium: 2000, energy: 800, vrind: 1500 } },
  { level: 3, bonus: 3, cost: { aetherium_crystal: 2500, ferrite_titanium: 5000, energy: 2000, vrind: 4000 } },
];
export const MAX_RESEARCH_POINTS_LEVEL = RESEARCH_POINTS_TIERS.length;

// Research Points produced per cycle at a given upgrade level (base 1 + level).
export function researchPointsPerCycle(level) {
  return 1 + (level || 0);
}

// The next tier available to purchase after `level`, or null if maxed.
export function nextResearchPointsTier(level) {
  const next = (level || 0) + 1;
  return RESEARCH_POINTS_TIERS[next - 1] || null;
}