import { Prisma } from "@prisma/client";

export type Phase = "pre" | "post";
export type TaskSetId = "A" | "B";
export type TaskVersion = "A1" | "A2" | "B1" | "B2";
export type Strategy = "misleading" | "omission" | "pressure" | "obstruction";
export type Variant = "A" | "B";

export type TrialMeta = {
  participantId: string; // pid
  trialRunId: string; // rid

  phase: Phase;
  taskSetId: TaskSetId;
  taskVersion: TaskVersion;

  trialId: string;
  orderInSession?: number;

  strategy: Strategy;
  flowId: string;
  variant: Variant;
};

export type TrackEventInput = {
  ts?: number;
  page: "product" | "checkout" | "confirm" | "terms" | "gate";
  type: string;
  meta?: Prisma.InputJsonValue;
  payload?: Prisma.InputJsonValue;
};
