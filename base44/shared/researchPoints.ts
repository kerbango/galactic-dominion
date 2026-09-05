// Research Points generation & pool model — single source of truth.
//
// Research Points ARE a stored pool on the Empire (empire.research_points).
// The pool refills in discrete hourly chunks inside the existing per-minute
// resource tick: floor(elapsed_cycles / 60) full hourly generations are
// added, then clamped to the current maximum. Maximum and hourly generation
// both scale linearly from population (1M pop = 50 max / 50 per hr, floored)
// plus Research Point Synthesis tier bonuses, which raise BOTH max and gen.
// Martial Law does not affect Research Points.
import { totalResearchSpeedBonus } from './researchSpeed.ts';

export const BASE_HOURLY_RP = 50;
export const STARTING_RESEARCH_POINTS = 50;
export const RESEARCH_POOL_PER_MILLION_POP = BASE_HOURLY_RP;
export const POPULATION_PER_RP_UNIT = 1_000_000;

// Minimum effective RP cost floor after efficiency reductions — prevents a
// maxed-out research-efficiency bonus from reducing a tech's cost below a
// reasonable minimum (25% of its base tier cost).
const EFFICIENCY_MIN_FRACTION = 0.25;

// Base RP generation per hour derived from population (floored to an integer).
// 1M population = 50 RP/hr. Population is never fractional, so this never
// produces fractional RP.
export function researchHourlyGeneration(population, synthesisLevel = 0) {
  const pop = Math.max(0, Number(population) || 0);
  const base = Math.floor((pop / POPULATION_PER_RP_UNIT) * BASE_HOURLY_RP);
  return Math.max(0, base) + researchPointsSynthesisBonus(synthesisLevel);
}

// Maximum RP the empire can hold. Scales with population identically to
// hourly generation, plus the same synthesis tier bonuses (so a raised
// generation rate can always be retained rather than lost at the cap).
export function researchPoolMaximum(population, synthesisLevel = 0) {
  return researchHourlyGeneration(population, synthesisLevel);
}

// Flat cumulative RP/hr bonus granted by purchased Research Point Synthesis
// tiers. Each tier's rpHourlyBonus is added to BOTH the hourly generation and
// the maximum capacity.
export function researchPointsSynthesisBonus(level = 0) {
  let bonus = 0;
  for (let i = 0; i < Math.min(level, RESEARCH_POINTS_TIERS.length); i++) {
    bonus += RESEARCH_POINTS_TIERS[i].rpHourlyBonus;
  }
  return bonus;
}

// Full hourly research output for an empire: population base + synthesis tier
// bonuses, multiplied by research-speed/efficiency bonuses. `completedIds` is
// a Set (or iterable) of completed tech_id strings (for the quantum_computing
// bonus); `empire.research_speed_level` provides the purchased accelerator
// bonus. Both stack and multiply the base+synthesis rate.
//
// NOTE: this is the *generation* rate (RP/hr produced), NOT the cost discount.
// Efficiency (speed bonus) also reduces the effective RP cost of techs — see
// effectiveResearchPointsRequired below. Both use the same totalResearchSpeedBonus
// so generation and cost stay consistent.
export function researchHourlyRate(empire, completedIds) {
  const level = empire?.research_points_production_level || 0;
  const speedBonus = totalResearchSpeedBonus(completedIds, empire?.research_speed_level || 0);
  return researchHourlyGeneration(empire?.population || 0, level) * (1 + Math.max(0, speedBonus));
}

// Clamp a stored RP value to the empire's current maximum.
export function clampResearchPool(current, population, synthesisLevel = 0) {
  const max = researchPoolMaximum(population, synthesisLevel);
  return Math.min(max, Math.max(0, Number(current) || 0));
}

// Compatibility alias — older callers passed only population.
export function researchPointsPerHour(population) {
  return researchHourlyGeneration(population, 0);
}

// Fixed tier RP cost table — replaces the old exponential curve.
export const TIER_RP_COSTS = [50, 100, 150, 225, 325, 475, 700, 1000];

export function researchPointsCostForTier(tier) {
  const t = Math.max(1, Math.floor(Number(tier) || 1));
  const idx = Math.min(t, TIER_RP_COSTS.length) - 1;
  return TIER_RP_COSTS[idx];
}

// Blacklisted / forbidden techs cost substantially more than same-tier
// conventional techs (3x surcharge).
export const BLACKLISTED_RP_SURCHARGE = 3;

export function researchPointsCostForTech(tech) {
  const base = researchPointsCostForTier(tech?.tier || 1);
  const tags = tech?.unlockTags;
  if (Array.isArray(tags) && tags.includes('blacklisted')) {
    return Math.round(base * BLACKLISTED_RP_SURCHARGE);
  }
  return base;
}

// Effective RP required for a tech after research-efficiency reductions.
// `totalBonus` is the stacked quantum_computing + research_speed_level bonus
// (0.10 increments). The effective cost is floored at 25% of the base cost so
// a maxed bonus can never make research free.
export function effectiveResearchPointsRequired(tech, totalBonus) {
  const base = researchPointsCostForTech(tech);
  const bonus = Math.max(0, Math.min(0.9, Number(totalBonus) || 0));
  const minFloor = Math.max(1, Math.round(base * EFFICIENCY_MIN_FRACTION));
  return Math.max(minFloor, Math.round(base * (1 - bonus)));
}

// Effective required RP given an already-known base cost (e.g. the stored
// research_points_required) and a live total efficiency bonus. Floors at 25%
// of the base cost.
export function effectiveRequiredFromBase(baseCost, totalBonus) {
  const base = Math.max(1, Number(baseCost) || 1);
  const bonus = Math.max(0, Math.min(0.9, Number(totalBonus) || 0));
  const minFloor = Math.max(1, Math.round(base * EFFICIENCY_MIN_FRACTION));
  return Math.max(minFloor, Math.round(base * (1 - bonus)));
}

// Convenience: effective required RP directly from an empire's state.
export function effectiveResearchPointsRequiredForEmpire(tech, completedIds, researchSpeedLevel) {
  return effectiveResearchPointsRequired(tech, totalResearchSpeedBonus(completedIds, researchSpeedLevel));
}

// Purchasable "Research Point Synthesis" tiers. Each tier grants a flat RP/hr
// bonus (additive to both the base generation rate and the maximum capacity).
// Martial Law does not affect Research Points.
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