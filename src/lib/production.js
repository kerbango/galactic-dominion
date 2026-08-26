import { TECH_TREE } from '@/data/techTree';

// Each completed tech in a category adds +1/hr to its mapped resource. This
// ties the player's research progression directly to their economy.
export const CATEGORY_TO_RESOURCE = {
  Energy: 'energy',
  Construction: 'ferrite_titanium',
  Computing: 'aetherium_crystal',
  Propulsion: 'energy',
  Industry: 'ferrite_titanium',
  Weapons: 'ferrite_titanium',
  Biotechnology: 'aetherium_crystal',
  Economics: 'vrind',
  Military: 'vrind',
  'Ship Technology': 'ferrite_titanium',
  Terraforming: 'aetherium_crystal',
  Automation: 'energy',
};

// Base production per hour from the production cycle (+1 of every resource
// per cycle). Cycle is 1 minute during testing → 60/hr.
export const BASE_PER_HOUR = 60;

export const PRODUCTION_RESOURCES = ['aetherium_crystal', 'ferrite_titanium', 'energy', 'vrind'];

const TECH_CATEGORY = new Map(TECH_TREE.map((t) => [t.id, t.category]));

// Given an array of completed TechProgress records, returns per-resource
// production per hour: { aetherium_crystal, ferrite_titanium, energy, vrind }.
export function productionPerHour(completedTechProgress) {
  const bonus = { aetherium_crystal: 0, ferrite_titanium: 0, energy: 0, vrind: 0 };
  for (const tp of completedTechProgress || []) {
    const cat = TECH_CATEGORY.get(tp.tech_id);
    const res = cat ? CATEGORY_TO_RESOURCE[cat] : null;
    if (res) bonus[res] += 1;
  }
  const rates = {};
  for (const k of PRODUCTION_RESOURCES) rates[k] = BASE_PER_HOUR + (bonus[k] || 0);
  return rates;
}