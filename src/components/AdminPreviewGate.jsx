import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import SectionPlaceholder from '@/pages/SectionPlaceholder';

// Temporarily gates a game section so only admins can preview the live
// page (and their in-progress edits). Non-admin players see the standard
// "under construction" notice instead. Revert the three routes in App.jsx
// and the adminOnly flags in navItems.js to reopen these to everyone.
export default function AdminPreviewGate({ Page, title, Icon }) {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Page />;
  return <SectionPlaceholder title={title} Icon={Icon} />;
}