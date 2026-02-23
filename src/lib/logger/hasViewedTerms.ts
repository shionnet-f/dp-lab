"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";

type AnyMeta = any;

/**
 * Commit18: 同一 trialRunId の中に view_terms があるかで判定
 */
export async function hasViewedTerms(trial: TrialMeta): Promise<boolean> {
  if (!trial.trialRunId) return false;

  const rows = await prisma.eventLog.findMany({
    where: { type: "view_terms" },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { meta: true, ts: true },
  });

  for (const r of rows) {
    const t = (r.meta as AnyMeta)?.trial;
    if (t?.trialRunId !== trial.trialRunId) continue;
    return true;
  }
  return false;
}
