"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";
import { track } from "@/lib/logger/track";

type AnyMeta = any;

function sameTrial(t: any, trial: TrialMeta) {
  return (
    t?.participantId === trial.participantId &&
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
 * このtrial（+pid）の「直近のsubmit_confirm以降」に trial_start が無ければ作る。
 * 作成/既存を問わず trialRunId を返す。
 */
export async function ensureTrialStart(trial: TrialMeta): Promise<string> {
  const rows = await prisma.eventLog.findMany({
    where: { type: { in: ["trial_start", "submit_confirm"] } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { type: true, ts: true, meta: true },
  });

  // 直近 submit_confirm を境界にする（暫定）
  let lastSubmitTs: number | null = null;
  for (const r of rows) {
    if (r.type !== "submit_confirm") continue;
    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;
    lastSubmitTs = r.ts;
    break;
  }
  const boundary = lastSubmitTs ?? -Infinity;

  // boundary以降に trial_start があるなら、そのtrialRunIdを返す
  for (const r of rows) {
    if (r.type !== "trial_start") continue;
    if (r.ts <= boundary) continue;

    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;

    const rid = t?.trialRunId;
    if (typeof rid === "string" && rid.length > 0) return rid;

    break;
  }
  const rid = crypto.randomUUID();

  await track(
    { ...trial, trialRunId: rid },
    { page: "product", type: "trial_start", payload: { trialRunId: rid } },
  );

  return rid;
}
