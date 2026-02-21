"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";
import { track } from "@/lib/logger/track";

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
 * このtrialの「直近のsubmit_confirm以降」に trial_start が無ければ作る（暫定）
 * session/trialRunId が無い段階でも「1試行=1購入フロー」の開始を保証するため。
 */
export async function ensureTrialStart(trial: TrialMeta): Promise<void> {
  const rows = await prisma.eventLog.findMany({
    where: { type: { in: ["trial_start", "submit_confirm"] } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { type: true, ts: true, meta: true },
  });

  // 直近 submit_confirm を境界にする（Commit14と同じ暫定思想）
  let lastSubmitTs: number | null = null;
  for (const r of rows) {
    if (r.type !== "submit_confirm") continue;
    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;
    lastSubmitTs = r.ts;
    break;
  }
  const boundary = lastSubmitTs ?? -Infinity;

  // boundary以降に trial_start が既にあるなら何もしない
  for (const r of rows) {
    if (r.type !== "trial_start") continue;
    if (r.ts <= boundary) continue;
    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;
    return;
  }

  // 無いので作る
  await track(trial, { page: "product", type: "trial_start" });
}
