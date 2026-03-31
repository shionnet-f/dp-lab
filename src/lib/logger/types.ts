import { Prisma } from "@prisma/client";

export type Phase = "pre" | "post";
export type TaskSetId = "A" | "B";
export type TaskVersion = "A1" | "A2" | "B1" | "B2";
export type Strategy = "misleading" | "omission" | "pressure" | "obstruction";
export type Variant = "A" | "B";

// 条件（condition）だけ：URL + trialConfig で確定する
export type TrialCondition = {
  phase: Phase;
  taskSetId: TaskSetId;
  taskVersion: TaskVersion;

  trialId: string;
  orderInSession?: number;

  strategy: Strategy;
  flowId: string;
  variant: Variant;
};

// 1試行（run）まで確定した完全形：pid/rid 付き
export type TrialMeta = TrialCondition & {
  participantId: string; // pid
  trialRunId: string; // rid
};

export type TrackEventInput = {
  ts?: number;
  page: "product" | "checkout" | "confirm" | "terms" | "gate";
  type: string;
  meta?: Prisma.InputJsonValue;
  payload?: Prisma.InputJsonValue;
};
