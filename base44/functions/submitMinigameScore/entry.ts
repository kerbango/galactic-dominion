import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Submits a minigame score to the combined leaderboard, enforces the shared
// daily play limit (5 plays/day across both games), and settles VRIND payouts
// for the top 3 ranks (1st=50, 2nd=25, 3rd=5). Payout settlement is a delta
// between the previous top-3 set and the new top-3 set, so empires bumped out
// of the top 3 have their prior payout reclaimed and new entrants are credited
// — only the net difference is applied per empire, keeping the settlement
// idempotent for a single submission.

const PAYOUTS = [50, 25, 5];
const DAILY_LIMIT = 5;
const VALID_GAMES = ['power_grid', 'radar_shooter'];

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Sum the rank payouts owed to each empire across the top 3 scores.
function payoutByEmpire(topScores) {
  const map = {};
  topScores.slice(0, 3).forEach((s, i) => {
    const eid = s.empire_id;
    if (!eid) return;
    map[eid] = (map[eid] || 0) + PAYOUTS[i];
  });
  return map;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const score = Number(body?.score);
    const game = body?.game;
    if (!Number.isFinite(score) || score < 0) {
      return Response.json({ error: 'Invalid score.' }, { status: 400 });
    }
    if (!VALID_GAMES.includes(game)) {
      return Response.json({ error: 'Invalid game.' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const empires = await svc.entities.Empire.filter({ created_by_id: user.id });
    const empire = empires[0];
    if (!empire) return Response.json({ error: 'You must found an empire first.' }, { status: 400 });

    const today = todayUTC();

    // Shared daily limit: count the caller's scores submitted today (UTC).
    const myToday = await base44.entities.MinigameScore.filter({
      play_date: today,
      created_by_id: user.id,
    });
    if (myToday.length >= DAILY_LIMIT) {
      return Response.json({ error: 'daily_limit_reached', remaining: 0 }, { status: 400 });
    }

    // Snapshot the previous top scores before inserting, to compute payouts
    // owed under the old ranking.
    const prevScores = await svc.entities.MinigameScore.list('-score', 20);
    const oldPayout = payoutByEmpire(prevScores);

    // Insert the new score (user-scoped so created_by_id is the caller).
    const created = await base44.entities.MinigameScore.create({
      score,
      game,
      empire_name: empire.empire_name,
      empire_id: empire.id,
      play_date: today,
    });

    // New ranking after the insert.
    const newScores = await svc.entities.MinigameScore.list('-score', 20);
    const newPayout = payoutByEmpire(newScores);

    // Settle the per-empire delta: credit new entrants / higher ranks, reclaim
    // those bumped down or out of the top 3.
    const empireIds = new Set([...Object.keys(oldPayout), ...Object.keys(newPayout)]);
    for (const eid of empireIds) {
      const delta = (newPayout[eid] || 0) - (oldPayout[eid] || 0);
      if (delta === 0) continue;
      const target = await svc.entities.Empire.get(eid);
      if (!target) continue;
      const newVrind = Math.max(0, (target.vrind || 0) + delta);
      await svc.entities.Empire.update(eid, { vrind: newVrind });
    }

    // Did this submission land in the top 3?
    let myRank = 0;
    let myPayout = 0;
    newScores.slice(0, 3).forEach((s, i) => {
      if (s.id === created.id) {
        myRank = i + 1;
        myPayout = PAYOUTS[i];
      }
    });

    const top5 = newScores.slice(0, 5).map((s) => ({
      empire_name: s.empire_name,
      game: s.game,
      score: s.score,
      is_me: s.created_by_id === user.id,
    }));

    const remaining = Math.max(0, DAILY_LIMIT - (myToday.length + 1));

    return Response.json({
      ok: true,
      top5,
      remaining,
      my_rank: myRank,
      my_payout: myPayout,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}