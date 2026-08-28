// Empire-wide upgrade definitions — gated by a specific tech being
// completed. Each has tiered levels; the purchased level is stored in the
// Empire's empire_upgrade_levels map (keyed by upgrade id). Effects are
// combat-oriented and stored for later combat integration (combat is
// deferred). The ids match the `unlocks.upgrades` entries in the tech tree
// so the info panel can reference them.

export const EMPIRE_UPGRADES = [
  {
    id: "plasma_efficiency",
    name: "Plasma Efficiency",
    description: "Refine plasma containment for more destructive fleet volleys.",
    gatingTechId: "plasma_weapons",
    effectLabel: "Fleet Attack",
    tiers: [
      { level: 1, bonus: 0.05, cost: { aetherium_crystal: 300, ferrite_titanium: 600, vrind: 800 } },
      { level: 2, bonus: 0.10, cost: { aetherium_crystal: 800, ferrite_titanium: 1600, vrind: 2000 } },
      { level: 3, bonus: 0.15, cost: { aetherium_crystal: 2000, ferrite_titanium: 4000, vrind: 5000 } },
    ],
  },
  {
    id: "reinforced_hull_ii",
    name: "Reinforced Hull II",
    description: "Advanced structural bracing across the entire fleet.",
    gatingTechId: "battleship_hull",
    effectLabel: "Fleet Defense",
    tiers: [
      { level: 1, bonus: 0.05, cost: { aetherium_crystal: 400, ferrite_titanium: 1000, vrind: 1000 } },
      { level: 2, bonus: 0.10, cost: { aetherium_crystal: 1000, ferrite_titanium: 2500, vrind: 2500 } },
      { level: 3, bonus: 0.15, cost: { aetherium_crystal: 2500, ferrite_titanium: 6000, vrind: 6000 } },
    ],
  },
  {
    id: "heavy_armor",
    name: "Heavy Armor",
    description: "Dense composite plating for capital-grade survivability.",
    gatingTechId: "titan_hull",
    effectLabel: "Fleet Defense",
    tiers: [
      { level: 1, bonus: 0.08, cost: { aetherium_crystal: 1000, berentium: 200, ferrite_titanium: 2000, vrind: 2500 } },
      { level: 2, bonus: 0.16, cost: { aetherium_crystal: 2500, berentium: 500, ferrite_titanium: 5000, vrind: 6000 } },
      { level: 3, bonus: 0.24, cost: { aetherium_crystal: 6000, berentium: 1200, ferrite_titanium: 12000, vrind: 15000 } },
    ],
  },
];

const byId = new Map(EMPIRE_UPGRADES.map((u) => [u.id, u]));
export const getEmpireUpgrade = (id) => byId.get(id);

// A tech-gated empire upgrade is available when its gating tech is completed.
export function isEmpireUpgradeAvailable(upgrade, completedTechIds) {
  const set = completedTechIds instanceof Set ? completedTechIds : new Set(completedTechIds || []);
  return set.has(upgrade.gatingTechId);
}

export function getAvailableEmpireUpgrades(completedTechIds) {
  const set = completedTechIds instanceof Set ? completedTechIds : new Set(completedTechIds || []);
  return EMPIRE_UPGRADES.filter((u) => set.has(u.gatingTechId));
}

// Next tier to purchase after `level`, or null if maxed.
export function nextEmpireUpgradeTier(upgrade, level) {
  const next = (level || 0) + 1;
  return upgrade.tiers[next - 1] || null;
}