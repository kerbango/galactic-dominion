import React from 'react';
import { LockKeyhole } from 'lucide-react';

export default function ClassifiedField({ label, requires }) {
  return (
    <div className="rounded-lg border border-slate-500/20 bg-slate-950/35 p-3">
      <p className="command-label">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-slate-500">
        <LockKeyhole className="h-4 w-4" />
        <span className="font-mono text-xs tracking-widest">████████ CLASSIFIED</span>
      </div>
      <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-amber-300/65">Requires {requires} Scout</p>
    </div>
  );
}