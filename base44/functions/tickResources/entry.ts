import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTick } from '../../shared/authGuard.ts';
import { cyclesDue, martialLawMultiplier } from '../../shared/tickMath.ts';
import { totalResearchSpeedBonus, computeCompletionMs } from '../../shared/researchSpeed.ts';
import { researchPointsPerCycle } from '../../shared/researchPoints.ts';
import { processBuildCompletions } from '../../shared/buildCompletion.ts';

const VRIND_INCOME_UPGRADE_IDS = [
  'income_upgrade_i',
  'income_upgrade_ii',
  'income_upgrade_iii',
  'tax_office_i',
  'tax_office_ii',
  'tax_office_iii',
];

// All recurring VRIND upgrades are percentage bonuses to the normal VRIND
// production rate. They stack additively with one another, while temporary
// production multipliers such as Martial Law are applied afterward.
function recurringVrindMultiplier(empire) {
  const levels = empire?.empire_upgrade_levels || {};
  const bonuses = {
    income_upgrade_i: 0.05,
    income_upgrade_ii: 0.05,
    income_upgrade_iii: 0.05,
    tax_office_i: 0.05,
    tax_office_ii: 0.10,
    tax_office_iii: 0.15,
  };
  const bonus = VRIND_INCOME_UPGRADE_IDS.reduce((sum, id) => {
    return sum + (levels[id] > 0 ? bonuses[id] : 0);
  }, 0);
  return 1 + bonus;
}

// Resource + research + construction tick. Production is accumulated from
// the server-side last_tick_date, so players receive all due production after
// being offline. Research completion remains real-time and uses the shared
// research-speed calculation below.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await authorizeTick(base44);
    if (!guard.ok) return guard.response;

    const empires = await base44.asServiceRole.entities.Empire.list('-created_date', 1000);

    const now = Date.now();
    const tickedAt = new Date().toISOString();
    let ticked = 0;
    let granted = 0;
    let vrindGranted = 0;

    for (const empire of empires) {
      const due = cyclesDue(empire.last_tick_date, now);
      if (due <= 0) continue;

      const martialMultiplier = martialLawMultiplier(empire, now);
      const grant = due * martialMultiplier;
      const vrindGrant = grant * recurringVrindMultiplier(empire);
      const rpGrant = grant * researchPointsPerCycle(empire.research_points_production_level || 0);

      await base44.asServiceRole.entities.Empire.updateMany(
        { id: empire.id },
        { $inc: {
          aetherium_crystal: grant,
          ferrite_titanium: grant,
          energy: grant,
          vrind: vrindGrant,
          berentium: grant,
          research_points: rpGrant,
        }, $set: {
          last_tick_date: tickedAt,
        } }
      );
      ticked += 1;
      granted += grant;
      vrindGranted += vrindGrant;
    }

    // Time-based research completion. A record completes when
    // now >= start_date + research_turns * BASE_TURN_SECONDS * (1 - bonus)
    // where bonus stacks from a completed tech + the player's purchased
    // research-speed level. The tick cadence only affects when a completion
    // is detected, not the completion timestamp itself.
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

    const allUnits = await base44.asServiceRole.entities.Unit.list('-created_date', 5000);
    const buildsCompleted = await processBuildCompletions(base44.asServiceRole, allUnits, now);

    return Response.json({ ok: true, ticked, granted, vrindGranted, advanced, completed, buildsCompleted, at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
