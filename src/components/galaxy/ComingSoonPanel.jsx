import React from 'react';
import { Construction, X } from 'lucide-react';

// Shown for operations that don't have a functional system yet.
// Displays an "unavailable / coming soon" state rather than fake results.
export default function ComingSoonPanel({ title, description, onClose }) {
  return (
    <div className="rounded-lg border border-slate-600/30 bg-slate-950/40 p-4 relative">
      {onClose && (
        <button onClick={onClose} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span className="led led-dim" />
        <span className="command-label">Status: Unavailable</span>
      </div>
      <div className="flex items-start gap-3">
        <Construction className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-heading text-xs uppercase tracking-wider text-slate-300">{title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}