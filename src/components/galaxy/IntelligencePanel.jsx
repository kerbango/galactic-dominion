import React from 'react';
import ClassifiedField from './ClassifiedField';

const RESOURCE_LABELS = { aetherium_crystal: 'Aetherium', ferrite_titanium: 'Ferrite-Titanium', energy: 'Energy', vrind: 'VRIND', berentium: 'Berentium', research_points: 'Research Points' };
const rank = { none: 0, light: 1, medium: 2, heavy: 3 };
const Known = ({ label, children }) => <div className="rounded-lg border border-cyan-400/15 bg-cyan-950/10 p-3"><p className="command-label">{label}</p><div className="mt-2 text-sm text-cyan-50">{children}</div></div>;
const List = ({ items, empty }) => items?.length ? <div className="space-y-1">{items.map((item, i) => <p key={`${item.unit_type || item.system_name}-${i}`} className="font-mono text-xs">{item.name || item.system_name || 'Unknown'} · {item.count ?? item.fleet_size} {item.status ? `· ${item.status.replace('_', ' ')}` : ''}</p>)}</div> : <p className="font-mono text-xs text-muted-foreground">{empty}</p>;

export default function IntelligencePanel({ intel }) {
  const level = rank[intel?.intelligence_level] || 0;
  return <div className="grid grid-cols-1 gap-2">
    {level >= 1 ? <Known label="Resources"><div className="grid grid-cols-2 gap-1">{Object.entries(intel.resources || {}).map(([k, v]) => <span key={k} className="font-mono text-xs">{RESOURCE_LABELS[k] || k}: {Number(v).toLocaleString()}</span>)}</div></Known> : <ClassifiedField label="Resources" requires="Light" />}
    {level >= 2 ? <Known label="Population"><span className="font-mono">{Number(intel.population || 0).toLocaleString()}</span></Known> : <ClassifiedField label="Population" requires="Medium" />}
    {level >= 2 ? <Known label="Defense Strength"><span className="font-mono">{Number(intel.defense_strength || 0).toLocaleString()}</span></Known> : <ClassifiedField label="Defense Strength" requires="Medium" />}
    {level >= 3 ? <Known label="Stationed Fleets"><List items={intel.stationed_fleets} empty="No stationed ships detected" /></Known> : <ClassifiedField label="Stationed Fleets" requires="Heavy" />}
    {level >= 3 ? <Known label="Orbital Defenses"><List items={intel.orbital_defenses} empty="No defenses detected" /></Known> : <ClassifiedField label="Orbital Defenses" requires="Heavy" />}
    {level >= 3 ? <Known label="Active Military Operations"><List items={intel.active_operations} empty="No active operations detected" /></Known> : <ClassifiedField label="Active Military Operations" requires="Heavy" />}
  </div>;
}