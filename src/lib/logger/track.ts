import { Prisma } from "@prisma/client";
import { logEvent, type LogEventInput } from "@/lib/logger/logEvent";
import type { TrialMeta, TrackEventInput } from "@/lib/logger/types";

export async function track(trial: TrialMeta, ev: TrackEventInput) {
  const meta: Prisma.InputJsonValue = {
    ...(typeof ev.meta === "object" && ev.meta !== null ? (ev.meta as object) : {}),
    trial,
  };

  const input: LogEventInput = {
    ts: ev.ts ?? Date.now(),
    page: ev.page,
    type: ev.type,
    meta,
    payload: ev.payload ?? undefined,
  };

  await logEvent(input);
}
