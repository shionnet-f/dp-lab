import type { Strategy, Variant } from "@/lib/logger/types";

export type TrialConfig = {
  strategy: Strategy;
  flowId: string;
  variant: Variant;
};

export const trialConfigById: Record<string, TrialConfig> = {
  t000: { strategy: "misleading", flowId: "misleading_01", variant: "A" },
  t001: { strategy: "omission", flowId: "omission_01", variant: "A" },
  t002: { strategy: "pressure", flowId: "pressure_01", variant: "A" },
  t003: { strategy: "obstruction", flowId: "obstruction_01", variant: "A" },
};
