import { Prisma } from "@prisma/client";

export type Phase = "pre" | "post";
export type TaskSetId = "A" | "B";
export type TaskVersion = "A1" | "A2" | "B1" | "B2";
export type Strategy = "misleading" | "omission" | "pressure" | "obstruction";
export type Variant = "A" | "B";

export type TrialMeta = {
  participantId?: string; // 後でセッションから付与する想定（今は任意）
  sessionId?: string;

  trialRunId?: string;

  phase: Phase;
  taskSetId: TaskSetId;
  taskVersion: TaskVersion;

  trialId: string; // 例: "t001"
  orderInSession?: number;

  strategy: Strategy;
  flowId: string; // 例: "omission_02"
  variant: Variant; // "A" | "B"
};

export type TrackEventInput = {
  ts?: number;
  page: "product" | "checkout" | "confirm" | "terms";
  type: string; // 例: "button_click" / "modal_open" など
  meta?: Prisma.InputJsonValue;
  payload?: Prisma.InputJsonValue;
};
