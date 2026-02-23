"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";

type AnyMeta = any;

export async function calcTotalTimeMs(trial: TrialMeta): Promise<number> {
  const row = await prisma.eventLog.findFirst({
    where: { type: "trial_start" },
    orderBy: { createdAt: "desc" },
    select: { ts: true, meta: true },
  });

  const rows = await prisma.eventLog.findMany({
    where: { type: "trial_start" },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { ts: true, meta: true },
  });

  let startTs: number | null = null;
  for (const r of rows) {
    const t = (r.meta as AnyMeta)?.trial;
    if (t?.trialRunId === trial.trialRunId) {
      startTs = r.ts;
      break;
    }
  }

  if (startTs === null) return 0;

  const diff = Date.now() - startTs;
  return diff >= 0 ? diff : 0;
}
