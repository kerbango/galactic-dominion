import { TECH_TREE } from '@/data/techTree';
import { economyProductionRates } from '../../base44/shared/economyProduction';

// Production is driven by the same research/upgrade calculation used by the
// server tick. The one-minute game heartbeat means a base 1/hour rate appears
// as 60/hour on the command console during the current testing economy.
export const BASE_PER_HOUR = 60;
export const PRODUCTION_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

// Convert the canonical economy rates (base = 1/hour) into the command
// console's current hourly display scale. Aetherium remains zero until its
// T4 production technology is researched.
export function productionPerHour(completedTechProgress, empire = {}) {
  const doneIds = new Set(
    (completedTechProgress || [])
      .filter((tp) => tp?.status === 'completed')
      .map((tp) => tp.tech_id)
  );
  const rates = economyProductionRates(doneIds, empire?.empire_upgrade_levels || {});

  return {
    aetherium_crystal: rates.aetherium * BASE_PER_HOUR,
    ferrite_titanium: rates.ferrite * BASE_PER_HOUR,
    energy: rates.energy * BASE_PER_HOUR,
    // VRIND keeps its existing cycle-based economy and income-upgrade system.
    vrind: BASE_PER_HOUR,
    berentium: rates.berentium * BASE_PER_HOUR,
  };
}

// Retained for consumers that use the old category mapping while migrating to
// the canonical Economy & Resources tree.
export const CATEGORY_TO_RESOURCE = Object.fromEntries(
  TECH_TREE.map((tech) => [tech.category, null])
);
