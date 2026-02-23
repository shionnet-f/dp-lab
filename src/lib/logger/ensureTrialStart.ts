"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";
import { track } from "@/lib/logger/track";
import { randomUUID } from "crypto";

type AnyMeta = any;

function sameTrialNoRun(t: any, trial: TrialMeta) {
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
 * + Commit18: trialRunId を確定し返す（1試行=1 run）
 */
export async function ensureTrialStart(trial: TrialMeta): Promise<string> {
  const rows = await prisma.eventLog.findMany({
    where: { type: { in: ["trial_start", "submit_confirm"] } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { type: true, ts: true, meta: true },
  });

  // 直近 submit_confirm を境界にする（これ自体は暫定思想のまま）
  let lastSubmitTs: number | null = null;
  for (const r of rows) {
    if (r.type !== "submit_confirm") continue;
    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrialNoRun(t, trial)) continue;
    lastSubmitTs = r.ts;
    break;
  }
  const boundary = lastSubmitTs ?? -Infinity;

  // boundary以降の trial_start があるなら、その runId を返す
  for (const r of rows) {
    if (r.type !== "trial_start") continue;
    if (r.ts <= boundary) continue;

    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrialNoRun(t, trial)) continue;

    const runId = t?.trialRunId;
    if (typeof runId === "string" && runId.length > 0) return runId;

    // runId欠損の古いデータが混ざってる場合は新規runを発行する
    break;
  }

  // 無いので新規runを発行して trial_start を作る
  const trialRunId = randomUUID();
  await track({ ...trial, trialRunId }, { page: "product", type: "trial_start" });
  return trialRunId;
}
