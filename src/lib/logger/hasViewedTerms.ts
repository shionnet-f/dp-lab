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
 * 「この trial の直近の submit_confirm 以降に view_terms があるか」で判定する
 * （session/trial_start が無い段階でも、過去ログ汚染を防げる）
 */
export async function hasViewedTerms(trial: TrialMeta): Promise<boolean> {
  // view_terms / submit_confirm だけを拾う（多くても軽い）
  const rows = await prisma.eventLog.findMany({
    where: { type: { in: ["view_terms", "submit_confirm"] } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { type: true, ts: true, meta: true },
  });

  // まず「このtrialの直近のsubmit_confirmのts」を探す
  let lastSubmitTs: number | null = null;
  for (const r of rows) {
    if (r.type !== "submit_confirm") continue;
    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;
    lastSubmitTs = r.ts;
    break; // descなので最初が直近
  }

  // lastSubmitTs が null の場合は「初回試行」扱いなので、境界なしで判定
  const boundary = lastSubmitTs ?? -Infinity;

  // boundary より後に view_terms があるか？
  for (const r of rows) {
    if (r.type !== "view_terms") continue;
    if (r.ts <= boundary) continue;

    const t = (r.meta as AnyMeta)?.trial;
    if (!sameTrial(t, trial)) continue;

    return true;
  }

  return false;
}
