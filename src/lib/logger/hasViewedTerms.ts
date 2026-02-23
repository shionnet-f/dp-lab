"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";

type AnyMeta = any;

export async function hasViewedTerms(trial: TrialMeta): Promise<boolean> {
  const rows = await prisma.eventLog.findMany({
    where: { type: "view_terms" },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { meta: true },
  });

  for (const r of rows) {
    const t = (r.meta as AnyMeta)?.trial;
    if (t?.trialRunId === trial.trialRunId) return true;
  }

  return false;
}
