// Shared research-advancement logic used by both the scheduled tickResources
// and the client-triggered tickMyEmpire. Research output is generated per hour
// from the empire's population and research-speed bonuses, then pro-rated
// across the elapsed production cycles (minutes). It is NOT stored as a pool —
// each cycle's output is applied directly to the empire's single oldest active
// TechProgress record, and any excess (when the tech completes mid-cycle) is
// discarded. When the oldest record completes, the next oldest receives output
// on the following tick.
import { researchPointsPerHour } from './researchPoints.ts';
import { totalResearchSpeedBonus } from './researchSpeed.ts';

// Advances the empire's oldest active research record by the pro-rated output
// for `due` production cycles (minutes). `researchingRecords` is the list of
// the empire's TechProgress records with status 'researching'. Returns the
// amount invested and whether a technology completed.
export async function advanceResearch(svc, empire, due, completedSet, researchingRecords) {
  if (due <= 0 || !researchingRecords || researchingRecords.length === 0) {
    return { invested: 0, completed: 0, techId: null };
  }
  const speedBonus = totalResearchSpeedBonus(completedSet, empire?.research_speed_level || 0);
  const hourlyRate = researchPointsPerHour(empire?.population || 0) * (1 + Math.max(0, speedBonus));
  const rpThisTick = hourlyRate * (due / 60);
  if (rpThisTick <= 0) return { invested: 0, completed: 0, techId: null };

  const sorted = researchingRecords
    .slice()
    .sort((a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime());
  const project = sorted[0];
  const required = Math.max(1, Number(project.research_points_required) || 500);
  const invested = Math.max(0, Number(project.research_points_invested) || 0);
  const remaining = Math.max(0, required - invested);
  if (remaining <= 0) return { invested: 0, completed: 0, techId: null };

  const invest = Math.min(remaining, rpThisTick);
  const nextInvested = invested + invest;
  const complete = nextInvested >= required - 0.000001;
  await svc.entities.TechProgress.update(project.id, {
    research_points_invested: complete ? required : nextInvested,
    progress: complete ? required : nextInvested,
    status: complete ? 'completed' : 'researching',
  });
  return { invested: invest, completed: complete ? 1 : 0, techId: project.tech_id };
}