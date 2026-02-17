import type { Strategy, Variant } from "@/lib/logger/types";

export type TrialConfig = {
    strategy: Strategy;
    flowId: string;
    variant: Variant;
};

export const trialConfigById: Record<string, TrialConfig> = {
    t000: { strategy: "misleading", flowId: "misleading_01", variant: "A" },
};
