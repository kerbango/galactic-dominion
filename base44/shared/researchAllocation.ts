// Research allocation model.
// Research Points are a renewable stored pool on the Empire, capped by
// population. Players may split the available pool across any number of active
// technologies, provided the total allocation never exceeds 100%.
//
// Cost functions are delegated to researchPoints.ts (single source of truth)
// so the fixed tier table and blacklisted surcharge are never duplicated.

import {
  RESEARCH_POOL_PER_MILLION_POP as _RP_PER_MILLION,
  STARTING_RESEARCH_POINTS as _STARTING_RP,
  researchPoolMaximum as _poolMax,
  researchPointsCostForTier as _costForTier,
  researchPointsCostForTech as _costForTech,
  BLACKLISTED_RP_SURCHARGE as _BL_SURCHARGE,
} from './researchPoints.ts';

export const RESEARCH_POOL_PER_MILLION_POP = _RP_PER_MILLION;
export const STARTING_RESEARCH_POINTS = _STARTING_RP;
export const BLACKLISTED_RP_SURCHARGE = _BL_SURCHARGE;

// Maximum RP an empire can hold, derived from population (+ synthesis level).
export function researchPoolMaximum(population, synthesisLevel = 0) {
  return _poolMax(population, synthesisLevel);
}

export function clampResearchPool(current, population, synthesisLevel = 0) {
  const max = researchPoolMaximum(population, synthesisLevel);
  return Math.min(max, Math.max(0, Number(current) || 0));
}

// Fixed tier RP cost table (single source of truth in researchPoints.ts).
export function researchPointsCostForTier(tier) {
  return _costForTier(tier);
}

export function researchPointsCostForTech(tech) {
  return _costForTech(tech);
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