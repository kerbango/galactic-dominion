import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';
import { cyclesDue, martialLawMultiplier } from '../../shared/tickMath.ts';
import { totalResearchSpeedBonus, computeCompletionMs } from '../../shared/researchSpeed.ts';
import { researchPointsPerCycle } from '../../shared/researchPoints.ts';
import { processBuildCompletions } from '../../shared/buildCompletion.ts';

// Hourly resource tick. Each empire earns 1 of every resource (Aetherium
// Crystal, Ferrite-Titanium, Energy, VRIND) per run — every player controls
// a single planet. Runs on a schedule (see function.jsonc) but is also
// invokable by admins.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await authorizeTick(base44);
    if (!guard.ok) return guard.response;

    // Empire RLS is owner-only, so read/update as service role to reach every empire.
    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);

    const now = Date.now();
    const tickedAt = new Date().toISOString();
    let ticked = 0;
    let granted = 0;
    for (const empire of empires) {
      const due = cyclesDue(empire.last_tick_date, now);
      if (due <= 0) continue;
      const grant = due * martialLawMultiplier(empire, now);
      const rpGrant = grant * researchPointsPerCycle(empire.research_points_production_level || 0);
      await base44.asServiceRole.entities.Empire.updateMany(
        { id: empire.id },
        { $inc: {
          aetherium_crystal: grant,
          ferrite_titanium: grant,
          energy: grant,
          vrind: grant,
          berentium: grant,
          research_points: rpGrant,
        }, $set: {
          last_tick_date: tickedAt,
        } }
      );
      ticked += 1;
      granted += grant;
    }

    // Time-based research completion. A record completes when
    //   now >= start_date + research_turns * BASE_TURN_SECONDS * (1 - bonus)
    // where bonus stacks from a completed tech + the player's purchased
    // upgrade level. The tick cadence only affects how soon completions are
    // detected — not when they're due — so lengthening the cron is a pure
    // cost knob. TechProgress RLS is owner-only, so read/update as service
    // role to reach all players. Legacy records without start_date fall back
    // to created_date. `now` is declared above for the resource tick.
    const completedTech = await base44.asServiceRole.entities.TechProgress.filter(
      { status: 'completed' },
      '-created_date',
      5000
    );
    const completedByOwner = {};
    for (const c of completedTech) {
      (completedByOwner[c.created_by_id] ||= new Set()).add(c.tech_id);
    }
    const empireByOwner = {};
    for (const e of empires) empireByOwner[e.created_by_id] = e;

    const researching = await base44.asServiceRole.entities.TechProgress.filter(
      { status: 'researching' },
      '-created_date',
      5000
    );
    let advanced = 0;
    let completed = 0;
    for (const tp of researching) {
      const owner = tp.created_by_id;
      const doneSet = completedByOwner[owner] || new Set();
      const empire = empireByOwner[owner];
      const level = empire?.research_speed_level || 0;
      const bonus = totalResearchSpeedBonus(doneSet, level);
      const startMs = tp.start_date
        ? new Date(tp.start_date).getTime()
        : (tp.created_date ? new Date(tp.created_date).getTime() : now);
      const completionMs = computeCompletionMs(startMs, tp.research_turns, bonus);
      if (now >= completionMs) {
        await base44.asServiceRole.entities.TechProgress.update(tp.id, {
          status: 'completed',
          progress: tp.research_turns || 1,
        });
        (completedByOwner[owner] ||= new Set()).add(tp.tech_id);
        completed += 1;
      } else {
        advanced += 1;
      }
    }

    // Time-based ship-construction completion. Unit RLS is owner-only, so
    // read as service role to reach all players. A construction completes
    // when now >= construction_start_date + construction_turns * BASE_TURN_SECONDS.
    const allUnits = await base44.asServiceRole.entities.Unit.list('-created_date', 5000);
    const buildsCompleted = await processBuildCompletions(base44.asServiceRole, allUnits, now);

    return Response.json({ ok: true, ticked, granted, advanced, completed, buildsCompleted, at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}