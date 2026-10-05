// Aesthetic reference for the bio-mechanical alien race. Used to inform the
// visual design of future ship classes — prompts for generated ship art
// should draw on the palette, textures, and structural motifs described here.
//
// Reference image (public URL):
export const ALIEN_RACE_REFERENCE_IMAGE = 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/60cdc7087_image.png';

// Aesthetic profile distilled from the reference portrait. Ship art prompts
// should combine the bio-mechanical structural language with the ship's
// functional role to produce a cohesive alien fleet.
export const ALIEN_RACE_AESTHETIC = {
  // Core identity: a living construct — bone, chitin, and cable integrated
  // into a single bio-mechanical organism. Not a clean machine; a grown one.
  identity: 'bio-mechanical living construct — skeletal, fibrous, calcified, semi-mechanized',

  // Structural motifs to echo in hull shapes:
  structure: [
    'elongated, helmet-like crowns / exoskeletal skull-plates',
    'sweeping ridges curving outward and upward',
    'mandible-like jaw forms terminating in sharp fangs or tusks',
    'multi-layered exoskeletal chest plates with overlapping jagged wing-like shoulder armor',
    'thin tube-like organic or metallic cables looping back into the body',
  ],

  // Textures:
  texture: 'fibrous and calcified — a mix of bone, cartilage, and hardened chitin; deeply pitted, porous, organic surfaces',

  // Color palette (exact hex from the reference):
  palette: {
    lightHighlights: '#D2C8B5', // pale beige / off-white
    midTones: '#8B7A6A',       // muted sandy brown
    deepShadows: '#2D2520',    // dark coffee / near-black
  },

  // Lighting:
  lighting: 'dramatic, moody, high-contrast, focused on the center; deep dark vignetting toward the edges',

  // Background:
  background: 'dark and out-of-focus, with sprawling organic branch-like or vein-like structures that mirror the creature\'s own texture — a unified unsettling visual theme',

  // Prompt-building helper: returns a style suffix to append to a ship
  // description so generated art stays on-aesthetic.
  promptSuffix: () => ` Aesthetic: bio-mechanical living construct, skeletal and fibrous, calcified bone and hardened chitin textures, deeply pitted porous organic surfaces. Hull motifs: elongated exoskeletal skull-plates, sweeping outward-curving ridges, mandible-like forms with sharp fangs or tusks, overlapping jagged wing-like armor plates, thin organic metallic cables looping back into the body. Color palette: pale beige highlights (#D2C8B5), muted sandy brown mid-tones (#8B7A6A), dark coffee near-black shadows (#2D2520). Dramatic moody high-contrast lighting with deep vignetting. Dark out-of-focus background with sprawling organic branch-like vein structures mirroring the creature's texture. No text, no labels, no watermark.`,
};