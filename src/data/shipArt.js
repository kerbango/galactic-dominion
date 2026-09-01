// Centralized ship artwork registry. Map a unit type id to its artwork and
// schematic asset URLs. The shipyard UI consults getShipArt(unitType); when
// no entry exists it falls back to a tasteful SVG silhouette (ShipSilhouette),
// never a random or unrelated image. Add entries here as art becomes
// available — no UI changes required.
const SHIP_ART = {
  light_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/fa07a0737_lightscout.png' },
  medium_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/e5dbf0c69_mediumscout.png' },
  heavy_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/c4aa71c97_heavyscout.png' },
  phase_scout: { art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/70f1e681a_ChatGPTImageAug31202609_06_09AM.png' },
  light_frigate: {
    thumbnail: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/43b4e1484_light_frigate_thumbnail.png',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/ce42515b8_light_frigate_hero.png',
    schematic: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/6f6772c56_light_frigate_blueprint_views.png',
    variants: [
      { id: 'standard', label: 'Standard', art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/0673b09fd_light_frigate_standard_variant.png' },
      { id: 'missile_boat', label: 'Missile Boat', art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/09d8243b1_light_frigate_missile_boat_variant.png' },
      { id: 'anti_fighter', label: 'Anti-Fighter', art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/0dd132299_light_frigate_anti_fighter_variant.png' },
    ],
  },
};

export function getShipArt(unitType) {
  return SHIP_ART[unitType] || null;
}