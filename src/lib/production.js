import { TECH_TREE } from '@/data/techTree';
import { economyProductionRates } from '../../base44/shared/economyProduction';

// Production is driven by the same research/upgrade calculation used by the
// server tick. The one-minute game heartbeat means a base 1/hour rate appears
// as 60/hour on the command console during the current testing economy.
export const BASE_PER_HOUR = 60;
export const PRODUCTION_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind', 'berentium'];

const VRIND_UPGRADE_BONUSES = {
  income_upgrade_i: 0.05,
  income_upgrade_ii: 0.05,
  income_upgrade_iii: 0.05,
  tax_office_i: 0.05,
  tax_office_ii: 0.10,
  tax_office_iii: 0.15,
};

export function productionPerHour(completedTechProgress, empire = {}) {
  const doneIds = new Set(
    (completedTechProgress || [])
      .filter((tp) => tp?.status === 'completed')
      .map((tp) => tp.tech_id)
  );
  const rates = economyProductionRates(doneIds, empire?.empire_upgrade_levels || {});
  const levels = empire?.empire_upgrade_levels || {};
  const vrindMultiplier = 1 + Object.entries(VRIND_UPGRADE_BONUSES)
    .reduce((sum, [id, bonus]) => sum + (Number(levels[id] || 0) > 0 ? bonus : 0), 0);

  return {
    aetherium_crystal: rates.aetherium * BASE_PER_HOUR,
    ferrite_titanium: rates.ferrite * BASE_PER_HOUR,
    energy: rates.energy * BASE_PER_HOUR,
    vrind: BASE_PER_HOUR * vrindMultiplier,
    berentium: rates.berentium * BASE_PER_HOUR,
  };
}

// Retained for compatibility with older callers while the command screen now
// uses the canonical Economy & Resources production calculation above.
export const CATEGORY_TO_RESOURCE = Object.fromEntries(
  TECH_TREE.map((tech) => [tech.category, null])
);
