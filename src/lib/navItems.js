import { LayoutDashboard, Radar, User, Sword, FlaskConical, Wrench, Store, Radio, LifeBuoy, Handshake } from 'lucide-react';

// Single source of truth for the in-game quick-nav links used by both the
// desktop TopNav and the mobile hamburger menu.
export const NAV_ITEMS = [
  { to: '/console', label: 'Command', Icon: LayoutDashboard },
  { to: '/map', label: 'Map', Icon: Radar },
  { to: '/military', label: 'Military', Icon: Sword },
  { to: '/research', label: 'Research', Icon: FlaskConical },
  { to: '/upgrades', label: 'Upgrades', Icon: Wrench },
  { to: '/market', label: 'Market', Icon: Store },
  { to: '/alliance', label: 'Alliance', Icon: Handshake, adminOnly: true },
  { to: '/comms', label: 'Comms', Icon: Radio },
  { to: '/profile', label: 'Operations', Icon: User },
  { to: '/support', label: 'Support', Icon: LifeBuoy },
];