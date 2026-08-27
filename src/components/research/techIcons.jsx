import React from 'react';
import {
  Zap, Hammer, Cpu, Rocket, Factory, Sword, Dna, Coins, Shield,
  Ship, Globe, Bot, Crosshair, Sun, Atom, Flame, Skull, HelpCircle,
} from 'lucide-react';

// Maps the string icon names used in the tech dataset to lucide components.
export const TECH_ICONS = {
  Zap, Hammer, Cpu, Rocket, Factory, Sword, Dna, Coins, Shield,
  Ship, Globe, Bot, Crosshair, Sun, Atom, Flame, Skull,
};

export default function TechIcon({ name, className }) {
  const Ic = TECH_ICONS[name] || HelpCircle;
  return <Ic className={className} />;
}