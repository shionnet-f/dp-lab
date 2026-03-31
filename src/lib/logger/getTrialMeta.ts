import type { Phase, TaskSetId, TaskVersion, TrialCondition } from "@/lib/logger/types";
import { trialConfigById } from "@/config/trials";

function isPhase(v: string): v is Phase {
  return v === "pre" || v === "post";
}
function isTaskSetId(v: string): v is TaskSetId {
  return v === "A" || v === "B";
}
function isTaskVersion(v: string): v is TaskVersion {
  return v === "A1" || v === "A2" || v === "B1" || v === "B2";
}

export type TrialRouteParams = {
  phase: string;
  taskSetId: string;
  taskVersion: string;
  trialId: string;
};

export function getTrialMeta(params: TrialRouteParams): TrialCondition {
  const { phase, taskSetId, taskVersion, trialId } = params;

  if (!isPhase(phase)) throw new Error(`Invalid phase: ${phase}`);
  if (!isTaskSetId(taskSetId)) throw new Error(`Invalid taskSetId: ${taskSetId}`);
  if (!isTaskVersion(taskVersion)) throw new Error(`Invalid taskVersion: ${taskVersion}`);

  const cfg = trialConfigById[trialId];
  if (!cfg) throw new Error(`Missing trial config for trialId: ${trialId}`);

  return { phase, taskSetId, taskVersion, trialId, ...cfg };
}
