// Shared research-advancement logic used by both the scheduled tickResources
// and the client-triggered tickMyEmpire.
//
// Two-phase model:
//   1. REFILL — discrete hourly: floor(elapsed_cycles / 60) full hourly
//      generations are added to empire.research_points, clamped to the
//      current RP maximum. Unused RP is retained; a full pool gains nothing.
//   2. INVEST — the empire's currently available stored RP is auto-invested
//      into the single active TechProgress record, up to its remaining
//      *effective* required RP (after efficiency reductions). When invested
//      >= effective required, the record completes and unspent RP stays in
//      the pool. RP is never created from nothing and never over-invested.
import { researchHourlyGeneration, researchPoolMaximum, effectiveRequiredFromBase } from './researchPoints.ts';
import { totalResearchSpeedBonus } from './researchSpeed.ts';

// Advances the empire's research for `due` production cycles (minutes).
// `researchingRecords` is the list of the empire's TechProgress records with
// status 'researching'. Returns how much RP was refilled and invested, and
// whether a technology completed. The empire's research_points pool is
// updated in place on the service role.
export async function advanceResearch(svc, empire, due, completedSet, researchingRecords) {
  const result = { refilled: 0, invested: 0, completed: 0, techId: null };
  if (due <= 0) return result;

  // --- Phase 1: discrete hourly RP refill ---
  const hoursDue = Math.floor(due / 60);
  const synthesisLevel = empire?.research_points_production_level || 0;
  const generation = researchHourlyGeneration(empire?.population || 0, synthesisLevel);
  const max = researchPoolMaximum(empire?.population || 0, synthesisLevel);
  if (hoursDue > 0 && generation > 0) {
    const current = Math.max(0, Number(empire.research_points) || 0);
    if (current < max) {
      const add = Math.min(max - current, hoursDue * generation);
      if (add > 0) {
        await svc.entities.Empire.updateMany({ id: empire.id }, { $inc: { research_points: add } });
        empire.research_points = current + add;
        result.refilled = add;
      }
    }
  }

  // --- Phase 2: auto-invest stored RP into the active project ---
  if (!researchingRecords || researchingRecords.length === 0) return result;

  const sorted = researchingRecords
    .slice()
    .sort((a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime());
  const project = sorted[0];

  const speedBonus = totalResearchSpeedBonus(completedSet, empire?.research_speed_level || 0);
  // The stored research_points_required is the base fixed-tier cost (written at
  // start time). The live efficiency bonus reduces the effective requirement.
  const baseRequired = Math.max(1, Number(project.research_points_required) || 500);
  const effectiveRequired = effectiveRequiredFromBase(baseRequired, speedBonus);
  const invested = Math.max(0, Number(project.research_points_invested) || 0);
  const remaining = Math.max(0, effectiveRequired - invested);
  if (remaining <= 0) return result;

  const available = Math.max(0, Number(empire.research_points) || 0);
  if (available <= 0) return result;

  const invest = Math.min(remaining, available);
  const nextInvested = invested + invest;
  const complete = nextInvested >= effectiveRequired - 0.000001;

  await svc.entities.TechProgress.update(project.id, {
    research_points_invested: complete ? effectiveRequired : nextInvested,
    progress: complete ? effectiveRequired : nextInvested,
    status: complete ? 'completed' : 'researching',
  });
  await svc.entities.Empire.updateMany({ id: empire.id }, { $inc: { research_points: -invest } });
  empire.research_points = available - invest;

  result.invested = invest;
  if (complete) { result.completed = 1; result.techId = project.tech_id; }
  return result;
}