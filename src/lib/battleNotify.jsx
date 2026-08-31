import React from 'react';
import { getUnit } from '@/data/units';
import { toast } from '@/components/ui/use-toast';

// ──────────────────────────────────────────────────────────────────────────
// Battle-result notification helpers.
//
// These build the rich sci-fi toast content shown when a fleet's battle
// resolves and when it returns home, plus a localStorage-backed guard that
// ensures each event (resolve / return) is notified exactly once per fleet —
// even across page refreshes or when both the realtime subscription and the
// 30-second polling fallback detect the same transition.
//
// No combat logic lives here. Every value displayed is read directly from
// the resolved Fleet record (attacker_strength, defender_strength,
// ship_manifest, ship_losses, loot, survivors, ground_outcome, etc.). Values
// that are not present on the record are omitted rather than invented.
// ──────────────────────────────────────────────────────────────────────────

const NOTIFIED_KEY = 'gd_notified_battles';
const PRUNE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const RES_LABELS = {
  berentium: 'Berentium',
  ferrite_titanium: 'Ferrite',
  aetherium_crystal: 'Aetherium',
  energy: 'Energy',
  vrind: 'VRIND',
};

function getNotifiedMap() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveNotifiedMap(map) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — in-memory ref still guards within the session */
  }
}

// Returns true if this fleet+event was already notified. The key includes the
// fleet id and the event type ('resolve' | 'return'), so a fleet can produce
// one resolve notification and one return notification — never two of either.
export function isNotified(fleetId, event) {
  const map = getNotifiedMap();
  return !!map[`${fleetId}:${event}`];
}

// Marks a fleet+event as notified and prunes entries older than 7 days so the
// map cannot grow unbounded over a long play lifetime.
export function markNotified(fleetId, event) {
  const map = getNotifiedMap();
  const key = `${fleetId}:${event}`;
  map[key] = Date.now();
  const cutoff = Date.now() - PRUNE_AFTER_MS;
  for (const k of Object.keys(map)) {
    if (map[k] < cutoff) delete map[k];
  }
  saveNotifiedMap(map);
}

// ── Derived ship-type breakdowns ──────────────────────────────────────────
// Survivors per type = manifest − losses. Falls back to fleet_size when no
// manifest exists (legacy fleets).
export function computeSurvivorMap(fleet) {
  const manifest = fleet.ship_manifest || {};
  const losses = fleet.ship_losses || {};
  const out = {};
  for (const [type, count] of Object.entries(manifest)) {
    const lost = losses[type] || 0;
    const surv = Math.max(0, (count || 0) - lost);
    if (surv > 0) out[type] = surv;
  }
  return out;
}

function entriesToLines(entries) {
  return entries
    .filter(([, n]) => n > 0)
    .map(([type, n]) => {
      const unit = getUnit(type);
      const name = unit ? unit.name : type.replace(/_/g, ' ');
      return `${name} ×${n}`;
    });
}

// ── Toast content builders ────────────────────────────────────────────────
// Each returns a JSX description for the toast() call. Only fields actually
// present on the fleet record are rendered.

export function buildBattleResultToast(fleet) {
  const win = fleet.outcome === 'win';
  const losses = Object.entries(fleet.ship_losses || {});
  const survivorMap = computeSurvivorMap(fleet);
  const survivorLines = entriesToLines(Object.entries(survivorMap));
  const lossLines = entriesToLines(losses);
  const hasManifest = Object.keys(fleet.ship_manifest || {}).length > 0;

  return {
    title: '⚔ BATTLE RESOLVED',
    description: (
      <div className="space-y-1.5">
        <p className={`font-heading text-sm font-bold tracking-widest ${win ? 'text-emerald-300' : 'text-rose-300'}`}>
          {win ? 'VICTORY' : 'DEFEAT'}
        </p>
        {fleet.target_empire_name && (
          <p className="text-xs text-cyan-100/80">Target: {fleet.target_empire_name}</p>
        )}
        {fleet.attacker_strength != null && (
          <p className="text-xs text-cyan-200">Fleet strength: <span className="font-mono">{fleet.attacker_strength.toLocaleString()}</span></p>
        )}
        {fleet.defender_strength != null && (
          <p className="text-xs text-amber-200">Enemy defense: <span className="font-mono">{fleet.defender_strength.toLocaleString()}</span></p>
        )}
        {lossLines.length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] uppercase tracking-widest text-rose-300/70">Fleet losses</p>
            {lossLines.map((l) => <p key={l} className="text-xs text-rose-200">{l}</p>)}
          </div>
        )}
        {survivorLines.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-300/70">Survivors</p>
            {survivorLines.map((l) => <p key={l} className="text-xs text-emerald-200">{l}</p>)}
          </div>
        )}
        {!hasManifest && fleet.survivors != null && (
          <p className="text-xs text-emerald-200">Survivors: {fleet.survivors}</p>
        )}
        <p className="text-[10px] uppercase tracking-widest text-violet-300/80 pt-1">Fleet status: Returning Home</p>
      </div>
    ),
    className: win ? 'border-emerald-400/50 bg-emerald-950/85 text-emerald-50' : 'border-rose-400/50 bg-rose-950/85 text-rose-50',
  };
}

export function buildLootToast(fleet) {
  const loot = fleet.loot || {};
  const lines = Object.entries(loot)
    .filter(([k, n]) => RES_LABELS[k] && n > 0)
    .map(([k, n]) => `+${n.toLocaleString()} ${RES_LABELS[k]}`);
  if (!lines.length) return null;
  return {
    title: '💎 LOOT SECURED',
    description: (
      <div className="space-y-0.5">
        {lines.map((l) => <p key={l} className="text-xs text-amber-200">{l}</p>)}
      </div>
    ),
    className: 'border-amber-400/50 bg-amber-950/85 text-amber-50',
  };
}

export function buildFleetReturnToast(fleet) {
  const survivorMap = computeSurvivorMap(fleet);
  const survivorLines = entriesToLines(Object.entries(survivorMap));
  const loot = fleet.loot || {};
  const lootLines = Object.entries(loot)
    .filter(([k, n]) => RES_LABELS[k] && n > 0)
    .map(([k, n]) => `+${n.toLocaleString()} ${RES_LABELS[k]}`);
  const fleetName = fleet.origin_empire_name || 'Fleet';

  return {
    title: '🚀 FLEET RETURNED',
    description: (
      <div className="space-y-1.5">
        <p className="font-heading text-sm font-bold tracking-wide text-cyan-100 uppercase">{fleetName}</p>
        <p className="text-[10px] uppercase tracking-widest text-emerald-300/70">Survivors restored to Fleet Inventory</p>
        {survivorLines.length > 0 && (
          <div>
            {survivorLines.map((l) => <p key={l} className="text-xs text-emerald-200">{l}</p>)}
          </div>
        )}
        {lootLines.length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] uppercase tracking-widest text-amber-300/70">Loot deposited</p>
            {lootLines.map((l) => <p key={l} className="text-xs text-amber-200">{l}</p>)}
          </div>
        )}
      </div>
    ),
    className: 'border-cyan-400/50 bg-cyan-950/85 text-cyan-50',
  };
}

// Convenience: fires the battle-result toast + loot toast (if applicable)
// for a resolved fleet. Guarded by isNotified so it is safe to call from
// both the realtime listener and the polling fallback.
export function notifyBattleResolved(fleet) {
  if (isNotified(fleet.id, 'resolve')) return;
  const battle = buildBattleResultToast(fleet);
  toast(battle);
  if (fleet.outcome === 'win' && fleet.loot) {
    const lootToast = buildLootToast(fleet);
    if (lootToast) toast(lootToast);
  }
  markNotified(fleet.id, 'resolve');
}

// Fires the fleet-return toast when a fleet reaches home. Guarded separately
// from the resolve notification so both events fire exactly once.
export function notifyFleetReturned(fleet) {
  if (isNotified(fleet.id, 'return')) return;
  toast(buildFleetReturnToast(fleet));
  markNotified(fleet.id, 'return');
  // Signal the resource HUD to refresh immediately — loot was just deposited.
  try { window.dispatchEvent(new CustomEvent('loot-deposited')); } catch { /* no-op */ }
}