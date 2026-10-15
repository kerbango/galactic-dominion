// Concept-art registry for the Wanderer faction — the last Ancients, a
// vanished elder civilization who refused to ascend and stayed behind as
// guardians. Their ships are thousands of years old, heirlooms of a war no
// living species remembers.
//
// Each entry maps a ship id to its cinematic concept-art URL. Add entries
// here as art is generated — no UI changes required. The Military /
// inspection UIs can consult getWandererArt(shipId); when no entry exists
// they fall back to the standard ship silhouette.

const WANDERER_ART = {
  // The colossal dreadnought — a sleeping guardian, armor layered like
  // folded robes, eyes of blue light along its bow.
  the_unascended: {
    name: 'The Unascended',
    class: 'Dreadnought',
    description:
      'A colossal dreadnought shaped like a sleeping guardian, its armor layered like folded robes, eyes of blue light along its bow.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/e6a0579de_generated_image.png',
  },
  thal_verins_oath: {
    name: "Thal-Verin's Oath",
    class: 'Carrier',
    description:
      'A crescent-shaped carrier with docking bays like open ribs, small blade-shaped fighters launching from it.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/5ae6a59dc_generated_image.png',
  },
  the_silent_witness: {
    name: 'The Silent Witness',
    class: 'Scout',
    description:
      'A tiny scout ship shaped like a closed eye or seed pod, its hull covered in sensor glyphs, surrounded by a ring of floating crystal shards.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/d40f12b9c_generated_image.png',
  },
  ember_of_the_first_war: {
    name: 'Ember of the First War',
    class: 'Frigate',
    description:
      'A scarred frigate with half its hull fused and melted from an ancient battle, still fighting, with gold-lit repair seams across the damage.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/ac70d2ade_generated_image.png',
  },
  the_last_archive: {
    name: 'The Last Archive',
    class: 'Support Ship',
    description:
      'A vast slow ship that is a floating library, rings of glowing data-crystals rotating around its hull, defended by heavy guns.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/842f8ff77_generated_image.png',
  },
  bulwark: {
    name: 'Bulwark',
    class: 'Heavy Defender',
    description:
      'A massive slow guardian ship built to hold the line, layered obsidian shield-plates and heavy defensive guns, etched with ancient glyphs.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/a940cc958_generated_image.png',
  },
  lance: {
    name: 'Lance',
    class: 'Strike Cruiser',
    description:
      'A long narrow needle-like warship built for piercing strikes, with a single enormous forward lance cannon running its length.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/6ec5e0d11_generated_image.png',
  },
  relic_hunter: {
    name: 'Relic Hunter',
    class: 'Explorer',
    description:
      'A sleek fast exploration vessel built to seek out ancient artifacts, with a glowing sensor array and relic-recovery crane on its bow.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/87e1dc896_generated_image.png',
  },
  wanderers_courier: {
    name: "Wanderer's Courier",
    class: 'Courier',
    description:
      'A swift elegant transport built to carry messages and relics between the last Ancients, with a glowing cargo vault and message-relay spire.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/507078060_generated_image.png',
  },
  wrens_needle: {
    name: "Wren's Needle",
    class: 'Interceptor',
    description:
      'A tiny ultra-agile needle fighter built for darting strikes, with a sharp nose lance and twin pale-blue engine nacelles.',
    art: 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/a677ca4be_generated_image.png',
  },
};

export function getWandererArt(shipId) {
  return WANDERER_ART[shipId] || null;
}

export const WANDERER_SHIPS = Object.values(WANDERER_ART);