// Centralized ship artwork registry. Map a unit type id to its artwork and
// schematic asset URLs. The shipyard UI consults getShipArt(unitType); when
// no entry exists it falls back to a tasteful SVG silhouette (ShipSilhouette),
// never a random or unrelated image. Add entries here as art becomes
// available — no UI changes required.
const SHIP_ART = {
  light_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/a2b4325eb_ChatGPTImageSep1202608_49_22PM.png' },
  medium_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/34fc84737_ChatGPTImageSep1202608_50_27PM.png' },
  heavy_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/d747b3696_ChatGPTImageSep1202608_51_33PM.png' },
  phase_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/26c903876_ChatGPTImageSep1202608_55_20PM.png' },
  light_frigate: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/d8049c009_ChatGPTImageSep1202608_57_15PM.png' },
  medium_frigate: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/cd9d89865_ChatGPTImageSep1202608_59_11PM.png' },
  heavy_frigate: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/938621779_ChatGPTImageSep1202609_00_56PM.png' },
  light_destroyer: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/0f68e93a6_ChatGPTImageSep1202609_06_22PM.png' },
  heavy_destroyer: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/b520fbadd_ChatGPTImageSep1202609_09_50PM.png' },
};

export function getShipArt(unitType) {
  return SHIP_ART[unitType] || null;
}