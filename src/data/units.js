// Re-export the canonical unit dataset + build-completion helper so frontend
// code imports via the @ alias while backend functions import the same
// source from base44/shared.
export { UNITS, getUnit, isUnitUnlocked, getUnlockedUnits } from "../../base44/shared/units";
export { computeBuildCompletionMs } from "../../base44/shared/buildCompletion";