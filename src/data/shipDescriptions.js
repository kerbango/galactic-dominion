// User-authored ship descriptions for the Ship Registry. Map a unit_type id
// to a rich description string shown in the registry's expanded detail view.
// Add or edit entries here — the registry reads from this map at render time.
// Units without an entry fall back to the unit's built-in `description`.

export const SHIP_DESCRIPTIONS = {
  // carrier: "Your custom description here...",
  // light_scout: "Your custom description here...",
};

export function getShipDescription(unit) {
  if (!unit) return '';
  return SHIP_DESCRIPTIONS[unit.id] || unit.description || '';
}