import { BASE_TURN_SECONDS } from './researchSpeed.ts';

// Ship-construction completion is time-based, mirroring research: a build
// completes when now >= start_date + build_turns * BASE_TURN_SECONDS. This
// decouples completion from the tick cadence — the tick only controls how
// soon completions are detected, not when they're due. Shared by the
// scheduled tickResources (all empires) and the owner-callable tickMyEmpire
// (one player), so both finalize builds identically.

export function computeBuildCompletionMs(startMs, buildTurns) {
  const turns = Math.max(1, buildTurns || 1);
  return startMs + turns * BASE_TURN_SECONDS * 1000;
}

// Finalize every due construction among the given Unit records. Returns the
// number completed. `svc` must be the service-role client (Unit RLS is
// owner-only, so the scheduled tick reaches all players only via the service
// role). A completed build increments owned_count by 1 and clears the
// construction fields so a new build can start.
export async function processBuildCompletions(svc, units, now) {
  let completed = 0;
  for (const unit of units) {
    if (!unit.construction_start_date) continue;
    const startMs = new Date(unit.construction_start_date).getTime();
    const turns = unit.construction_turns || 1;
    if (now >= computeBuildCompletionMs(startMs, turns)) {
      await svc.entities.Unit.update(unit.id, {
        owned_count: (unit.owned_count || 0) + 1,
        construction_start_date: null,
        construction_turns: 1,
      });
      completed += 1;
    }
  }
  return completed;
}