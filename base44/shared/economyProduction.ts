// Galactic Dominion — Economy & Resources production rules.
// Rates are hourly production rates when the base rate is 1/hour.
// Research-node effects and purchased Roman-numeral upgrade effects compound.

export function economyProductionRates(doneIds, upgradeLevels = {}) {
  const done = doneIds instanceof Set ? doneIds : new Set(doneIds || []);
  const level = (id) => Number(upgradeLevels[id] || 0);
  const has = (id) => done.has(id);

  let ferrite = 1;
  let energy = 1;
  let berentium = 1;
  let aetherium = 0;

  if (has('mining_resource_generation')) { ferrite *= 1.10; energy *= 1.10; }
  if (has('sub_surface_mining')) { ferrite *= 1.20; berentium *= 1.02; }
  if (has('deep_core_extraction')) { ferrite *= 1.25; berentium *= 1.10; }
  if (has('planetary_solar_harness')) energy *= 1.50;
  if (has('intra_system_automated_mining')) { ferrite *= 2.00; berentium *= 1.75; }

  // T4 N1 introduces Aetherium Crystal at 0.10/hour.
  if (has('tectonic_shaft_mining')) { ferrite *= 1.50; berentium *= 1.40; aetherium = 0.10; }
  if (has('thermal_core_fracturing')) { ferrite *= 1.35; berentium *= 1.50; aetherium *= 1.10; }
  if (has('orbit_solar_reflector')) energy *= 1.75;
  if (has('intra_system_freighter_capacity')) { ferrite *= 1.25; berentium *= 1.25; aetherium *= 1.10; }

  if (has('magma_seam_extraction')) { ferrite *= 1.40; berentium *= 1.75; aetherium *= 1.15; energy *= 1.10; }
  if (has('core_plasma_excavation')) { ferrite *= 1.25; berentium *= 1.60; aetherium *= 1.15; energy *= 1.15; }
  if (has('orbital_energy_relay')) energy *= 2.00;
  if (has('orbit_cargo_rails')) { ferrite *= 2.00; berentium *= 2.00; }
  if (has('asteroid_harpooning')) { ferrite *= 1.75; berentium *= 1.75; aetherium *= 2.00; }
  if (has('orbital_slag_production')) { ferrite *= 1.10; berentium *= 1.10; aetherium *= 1.10; }

  if (has('gravimetric_core_harvesting')) { ferrite *= 1.25; berentium *= 1.25; aetherium *= 1.25; }
  if (has('atmosphere_ion_harvesting')) energy *= 1.02;
  if (has('mass_driver_sling')) { ferrite *= 1.10; berentium *= 1.10; aetherium *= 1.10; }
  if (has('laser_ablation_mining')) { ferrite *= 1.25; berentium *= 1.25; aetherium *= 1.50; }
  if (has('zero_point_extraction')) energy *= 2.00;

  // Roman-numeral upgrade page effects.
  if (level('planet_mining_iii') > 0) ferrite *= 1.25;
  else if (level('planet_mining_ii') > 0) ferrite *= 1.20;
  else if (level('planet_mining_i') > 0) ferrite *= 1.15;

  if (level('solar_energy_farm_ii') > 0) energy *= 1.20;
  else if (level('solar_energy_farm_i') > 0) energy *= 1.15;

  if (level('core_mining_iv') > 0) { ferrite *= 1.25; berentium *= 1.25; }
  else if (level('core_mining_iii') > 0) { ferrite *= 1.20; berentium *= 1.20; }
  else if (level('core_mining_ii') > 0) { ferrite *= 1.10; berentium *= 1.10; }
  else if (level('core_mining_i') > 0) { ferrite *= 1.05; berentium *= 1.05; }

  if (level('deep_core_syphon_iii') > 0) { ferrite *= 1.45; berentium *= 1.45; }
  else if (level('deep_core_syphon_ii') > 0) { ferrite *= 1.35; berentium *= 1.35; }
  else if (level('deep_core_syphon_i') > 0) { ferrite *= 1.25; berentium *= 1.25; }

  if (level('orbital_miners_iii') > 0) { ferrite *= 3; berentium *= 2; }

  if (level('adv_energy_collection_ii') > 0) energy *= 1.75;
  if (level('adv_energy_collection_iii') > 0) energy *= 1.75;
  if (level('adv_energy_connection_iv') > 0) energy *= 2.50;

  const plasmaLevels = Math.min(2, Math.max(0, level('plasma_extraction_ii') > 0 ? 2 : level('plasma_extraction_i') > 0 ? 1 : 0));
  if (plasmaLevels) {
    const m = Math.pow(1.50, plasmaLevels);
    ferrite *= m; energy *= m; berentium *= m; aetherium *= m;
  }

  if (level('cargo_rails_i') > 0) { ferrite *= 2; berentium *= 2; }
  if (level('asteroid_hostler') > 0) { ferrite *= 1.5; berentium *= 1.5; aetherium *= 1.5; }

  const scoop = level('debris_scoop_ii') > 0 ? 1.35 : level('debris_scoop_i') > 0 ? 1.25 : 1;
  ferrite *= scoop; berentium *= scoop; aetherium *= scoop;
  const gravity = level('gravity_furnace_ii') > 0 ? 1.15 : level('gravity_furnace_i') > 0 ? 1.10 : 1;
  ferrite *= gravity; berentium *= gravity; aetherium *= gravity;
  const sling = level('advanced_sling_mining_ii') > 0 ? 1.25 : level('advanced_sling_mining_i') > 0 ? 1.15 : 1;
  ferrite *= sling; berentium *= sling; aetherium *= sling;

  if (level('laser_ablator_i') > 0) { ferrite *= 2; berentium *= 2; aetherium *= 2; }

  // T6 N5 Zero-G Refinery and T7 N1 Stellar Corona Skimming are conversion
  // systems, not passive production. Their conversion ratios are handled by
  // their respective systems and do not alter the hourly collection rate.

  if (has('dyson_sphere')) { ferrite *= 5; energy *= 5; berentium *= 5; aetherium *= 5; }
  return { ferrite, energy, berentium, aetherium };
}
