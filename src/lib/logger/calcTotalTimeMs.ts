"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";

type AnyMeta = any;

function sameTrial(t: any, trial: TrialMeta) {
  return (
    t?.phase === trial.phase &&
    t?.taskSetId === trial.taskSetId &&
    t?.taskVersion === trial.taskVersion &&
    t?.trialId === trial.trialId &&
    t?.strategy === trial.strategy &&
    t?.flowId === trial.flowId &&
    t?.variant === trial.variant
  );
}

/**
 * 暫定境界：直近 submit_confirm 以降の trial_start を開始点として totalTimeMs を返す
 */
export async function calcTotalTimeMs(trial: TrialMeta): Promise<number> {
  const rows = await prisma.eventLog.findMany({
    where: { type: { in: ["trial_start", "submit_confirm"] } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { type: true, ts: true, meta: true },
  });

  // 直近 submit_confirm を境界
  let lastSubmitTs: number | null = null;
  for (const r of rows) {
    if (r.type !== "submit_confirm") continue;
    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;
    lastSubmitTs = r.ts;
    break;
  }
  const boundary = lastSubmitTs ?? -Infinity;

  // boundary以降の trial_start（最新）を探す
  let startTs: number | null = null;
  for (const r of rows) {
    if (r.type !== "trial_start") continue;
    if (r.ts <= boundary) continue;
    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;
    startTs = r.ts;
    break;
  }

  if (startTs === null) return 0;

  const now = Date.now();
  const diff = now - startTs;
  return diff >= 0 ? diff : 0;
}
