import { BASE_TURN_SECONDS } from './researchSpeed.ts';

export function computeBuildCompletionMs(startMs, buildTurns) {
  const turns = Math.max(1, buildTurns || 1);
  return startMs + turns * BASE_TURN_SECONDS * 1000;
}

// Finalize every due construction. If a Unit has additional paid ships in
// construction_queue, the completed ship is added to owned_count and the next
// ship immediately takes its place as the active timed build. This keeps the
// queue persistent across ticks and page refreshes.
export async function processBuildCompletions(svc, units, now) {
  let completed = 0;
  for (const unit of units) {
    if (!unit.construction_start_date) continue;
    const startMs = new Date(unit.construction_start_date).getTime();
    const turns = unit.construction_turns || 1;
    if (now < computeBuildCompletionMs(startMs, turns)) continue;

    const queue = Math.max(0, Number(unit.construction_queue || 0));
    let remainingQueue = queue;
    let owned = (unit.owned_count || 0) + 1;
    completed += 1;

    // Catch up multiple overdue ships if the player has been away long enough.
    let nextStart = computeBuildCompletionMs(startMs, turns);
    while (remainingQueue > 0 && now >= nextStart + turns * BASE_TURN_SECONDS * 1000) {
      owned += 1;
      remainingQueue -= 1;
      completed += 1;
      nextStart += turns * BASE_TURN_SECONDS * 1000;
    }

    if (remainingQueue > 0) {
      // The next queued ship starts exactly when the prior ship completed.
      await svc.entities.Unit.update(unit.id, {
        owned_count: owned,
        construction_start_date: new Date(nextStart).toISOString(),
        construction_turns: turns,
        construction_queue: remainingQueue,
      });
    } else {
      await svc.entities.Unit.update(unit.id, {
        owned_count: owned,
        construction_start_date: null,
        construction_turns: 1,
        construction_queue: 0,
      });
    }
  }
  return completed;
}