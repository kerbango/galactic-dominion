import React from 'react';

// Reusable section wrapper for the Planetary Command terminal layout.
export default function CommandSection({ label, icon: Icon, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-cyan-300/70" />}
          <p className="command-label">{label}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}