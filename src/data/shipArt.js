// Centralized ship artwork registry. Map a unit type id to its artwork and
// schematic asset URLs. The shipyard UI consults getShipArt(unitType); when
// no entry exists it falls back to a tasteful SVG silhouette (ShipSilhouette),
// never a random or unrelated image. Add entries here as art becomes
// available — no UI changes required.
const SHIP_ART = {
  light_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/fa07a0737_lightscout.png' },
  medium_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/e5dbf0c69_mediumscout.png' },
};

export function getShipArt(unitType) {
  return SHIP_ART[unitType] || null;
}