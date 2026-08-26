import {
  Zap, Hammer, Cpu, Rocket, Factory, Sword, Dna, Coins, Shield, Ship, Globe, Bot,
  Crosshair, Sun, Atom, Flame, Skull,
} from "lucide-react";
import { CATEGORIES } from "@/data/techTree";

export const TECH_ICONS = {
  Zap, Hammer, Cpu, Rocket, Factory, Sword, Dna, Coins, Shield, Ship, Globe, Bot,
  Crosshair, Sun, Atom, Flame, Skull,
};

export function getTechIcon(tech) {
  const fallback = CATEGORIES[tech.category]?.icon || "Cpu";
  const name = tech.icon || fallback;
  return TECH_ICONS[name] || TECH_ICONS[fallback] || Cpu;
}