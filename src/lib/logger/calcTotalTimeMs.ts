"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";

type AnyMeta = any;

/**
 * Commit18: 同一 trialRunId の trial_start を開始点として totalTimeMs を返す
 */
export async function calcTotalTimeMs(trial: TrialMeta): Promise<number> {
  if (!trial.trialRunId) return 0;

  const rows = await prisma.eventLog.findMany({
    where: { type: "trial_start" },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { ts: true, meta: true },
  });

  for (const r of rows) {
    const t = (r.meta as AnyMeta)?.trial;
    if (t?.trialRunId !== trial.trialRunId) continue;

    const diff = Date.now() - r.ts;
    return diff >= 0 ? diff : 0;
  }

  return 0;
}
