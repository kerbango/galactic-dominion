// Re-export the canonical unit dataset through the runtime ship-gating layer.
// The runtime layer preserves the existing ship catalog while applying the
// research gates and exploration-vessel naming used by the current tech tree.
export { UNITS, getUnit, isUnitUnlocked, getUnlockedUnits } from "../../base44/shared/unitsRuntime";
export { computeBuildCompletionMs } from "../../base44/shared/buildCompletion";
