import { Sword, Shield, Gauge, Eye, Compass, ShieldHalf, Layers, Ruler, Zap, Building2 } from 'lucide-react';

// Stat display profiles per unit category. Ships (and transports) use the
// full 9-stat profile; ground forces replace shielding + hull_armor with a
// single Armor stat; defensive structures show a Defense Rating bar.
const SHIP_STATS = [
  { key: 'attack', icon: Sword, label: 'ATK' },
  { key: 'defense', icon: Shield, label: 'DEF' },
  { key: 'stealth', icon: Eye, label: 'STH' },
  { key: 'exploration', icon: Compass, label: 'EXP' },
  { key: 'shielding', icon: ShieldHalf, label: 'SHD' },
  { key: 'hull_armor', icon: Layers, label: 'HUL' },
  { key: 'speed', icon: Gauge, label: 'SPD' },
  { key: 'range', icon: Ruler, label: 'RNG' },
  { key: 'efficiency', icon: Zap, label: 'EFF' },
];

const GROUND_STATS = [
  { key: 'attack', icon: Sword, label: 'FPW' },
  { key: 'armor', icon: Shield, label: 'ARM' },
  { key: 'speed', icon: Gauge, label: 'SPD' },
  { key: 'stealth', icon: Eye, label: 'STH' },
  { key: 'exploration', icon: Compass, label: 'EXP' },
  { key: 'range', icon: Ruler, label: 'RNG' },
  { key: 'efficiency', icon: Zap, label: 'EFF' },
];

const DEFENSE_STATS = [
  { key: 'defense_rating', icon: Building2, label: 'DEF' },
  { key: 'armor', icon: Shield, label: 'ARM' },
  { key: 'range', icon: Ruler, label: 'RNG' },
];

export function getStatDisplay(unit) {
  const cat = unit.category || 'ship';
  if (cat === 'ground') return GROUND_STATS;
  if (cat === 'defense') return DEFENSE_STATS;
  return SHIP_STATS;
}

export function isGroundUnit(unit) {
  return (unit.category || 'ship') === 'ground';
}

export function isDefenseStructure(unit) {
  return unit.category === 'defense';
}

export function isTransport(unit) {
  return unit.category === 'transport';
}

// Total carrying capacity for a given number of transport ships.
export function transportCapacity(unit, count) {
  if (!unit || (unit.category || 'ship') !== 'transport') return 0;
  return (unit.carryingCapacity || 0) * (count || 0);
}