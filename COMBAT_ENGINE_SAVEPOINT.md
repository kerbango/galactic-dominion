# Galactic Dominion — Combat Engine Save Point

**Save point:** Combat Engine — Pre-Rebuild
**Date:** 2026-09-02
**Branch:** tech-tree-rebuild

## Agreed combat design

The combat pipeline is:

1. Attack / Defense → effectiveness
2. Effectiveness → Combat Damage
3. Combat Damage receives ±5% randomness
4. Shielding absorbs damage
5. Hull Armor reduces remaining damage
6. Remaining damage applies to Health
7. Ships reaching zero Health are destroyed

### Effectiveness rule

The agreed **Option C** design is retained:

- Base effectiveness begins at **25% × Attack/Defense**.
- The 25% value is a component of separately calculated **Combat Damage**, rather than the entire damage formula.

### Combat Damage

Combat Damage is intended to come from the participating ships' weapons. Destroyed ships stop contributing weapon damage.

The exact weapon-damage system is still open and must be designed before implementation.

## Current implementation scanned

### `base44/shared/spaceCombat.ts`

Current code is still the legacy strength-vs-strength system:

- Attacker strength = ship count × attack × upgrade multiplier.
- Defender strength = Planet Defense Rating + stationed warship attack strength.
- Survivability uses Defense + Shielding + Hull Armor.
- Survivors are allocated by durability.
- No weapon-based Combat Damage, shields-as-absorption, armor damage reduction, or ship Health resolution exists here yet.

### `base44/functions/processFleets/entry.ts`

Current `resolveCombatAndReturn()` calls the legacy space-combat functions and then converts the result into fleet survivors/losses.

Existing systems to preserve during the combat rebuild:

- fleet travel
- battle timing / visible In Battle state
- loot
- ground combat
- return trips
- fleet storage / return processing
- research and unit upgrade integration

The combat-resolution layer should be replaced rather than rebuilding the surrounding fleet workflow.

## Important current legacy behavior

- Winner survivor rate: 70%
- Loser survivor rate: 30%
- Survivor cap: 95%
- Legacy fallback: 10 attack power per ship when no ship manifest exists

These are legacy mechanics and should not be treated as final combat rules.

## Next step

Scan `base44/shared/units.ts` and `base44/shared/unitUpgrades.ts` for every combat-relevant stat and upgrade, then design the weapon-damage and Health model using only the game's existing data where possible.
