// Research allocation model.
// Research Points are a renewable pool capped by population. Players may split
// the available pool across any number of active technologies, provided the
// total allocation never exceeds 100%.

export const RESEARCH_POOL_PER_MILLION_POP = 500;
export const STARTING_POPULATION = 1_000_000;
export const STARTING_RESEARCH_POINTS = 500;

export function researchPoolMaximum(population) {
  const pop = Math.max(0, Number(population) || 0);
  return Math.max(1, Math.floor((pop / 1_000_000) * RESEARCH_POOL_PER_MILLION_POP));
}

export function clampResearchPool(current, population) {
  const max = researchPoolMaximum(population);
  return Math.min(max, Math.max(0, Number(current) || 0));
}

// Research cost is a steep exponential: Tier I = 500 RP, doubling every tier.
// Tier IV = 4,000, Tier VI = 16,000, Tier VIII = 64,000 before any surcharge.
// Blacklisted / forbidden techs cost substantially more than same-tier
// conventional techs.
export const BLACKLISTED_RP_SURCHARGE = 3;

export function researchPointsCostForTier(tier) {
  const t = Math.max(1, Math.floor(Number(tier) || 1));
  return 500 * Math.pow(2, t - 1);
}

export function researchPointsCostForTech(tech) {
  const base = researchPointsCostForTier(tech?.tier || 1);
  const tags = tech?.unlockTags;
  if (Array.isArray(tags) && tags.includes('blacklisted')) {
    return Math.round(base * BLACKLISTED_RP_SURCHARGE);
  }
  return base;
}

export function allocationTotal(records, excludeId = null) {
  return records.reduce((sum, record) => {
    if (excludeId && record.id === excludeId) return sum;
    if (record.status !== 'researching') return sum;
    return sum + Math.max(0, Math.min(100, Number(record.allocation_percent) || 0));
  }, 0);
}

export function normalizeAllocation(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}