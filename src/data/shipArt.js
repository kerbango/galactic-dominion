// Centralized ship artwork registry. Map a unit type id to its artwork and
// schematic asset URLs. The shipyard UI consults getShipArt(unitType); when
// no entry exists it falls back to a tasteful SVG silhouette (ShipSilhouette),
// never a random or unrelated image. Add entries here as art becomes
// available — no UI changes required.
const SHIP_ART = {
  // Example:
  // Dreadnaught: { art: 'https://...dreadnaught.png', schematic: 'https://...dreadnaught-blueprint.png' },
};

export function getShipArt(unitType) {
  return SHIP_ART[unitType] || null;
}