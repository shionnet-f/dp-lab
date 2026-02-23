"use server";

import type { TrialMeta } from "@/lib/logger/types";
import { track } from "@/lib/logger/track";

function newRid() {
  return crypto.randomUUID();
}

export async function ensureTrialStart(
  input: Omit<TrialMeta, "trialRunId"> & { trialRunId?: string },
) {
  if (input.trialRunId) return input.trialRunId;

  const rid = newRid();

  // trial_start は rid を含む meta.trial で保存される
  await track(
    { ...input, trialRunId: rid },
    { page: "product", type: "trial_start", payload: { trialRunId: rid } },
  );

  return rid;
}
