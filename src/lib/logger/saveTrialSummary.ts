"use server";

import { prisma } from "@/lib/db";
import type { TrialMeta } from "@/lib/logger/types";
import type { Prisma } from "@prisma/client";

export async function saveTrialSummary(input: {
  meta: TrialMeta;
  isInappropriate: boolean;
  confirmedImportantInfo: boolean;
  totalTimeMs: number;
  extras?: Prisma.InputJsonValue;
}) {
  await prisma.trialSummary.create({
    data: {
      meta: input.meta,
      isInappropriate: input.isInappropriate,
      confirmedImportantInfo: input.confirmedImportantInfo,
      totalTimeMs: input.totalTimeMs,
      extras: input.extras,
    },
  });
}
