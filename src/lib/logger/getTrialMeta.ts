import type {
    Phase,
    TaskSetId,
    TaskVersion,
    Strategy,
    Variant,
    TrialMeta,
} from "@/lib/logger/types";

function isPhase(v: string): v is Phase {
    return v === "pre" || v === "post";
}
function isTaskSetId(v: string): v is TaskSetId {
    return v === "A" || v === "B";
}

function isTaskVersion(v: string): v is TaskVersion {
    return v === "A1" || v === "A2" || v === "B1" || v === "B2";
}

function isStrategy(v: string): v is Strategy {
    return (
        v === "misleading" ||
        v === "omission" ||
        v === "pressure" ||
        v === "obstruction"
    );
}
function isVariant(v: string): v is Variant {
    return v === "A" || v === "B";
}

export type TrialRouteParams = {
    phase: string;
    taskSetId: string;
    taskVersion: string;
    trialId: string;
};

export type TrialRouteSearchParams = {
    strategy?: string;
    flowId?: string;
    variant?: string;
};

export function getTrialMeta(
    params: TrialRouteParams,
    sp: TrialRouteSearchParams
): TrialMeta {
    const { phase, taskSetId, taskVersion, trialId } = params;

    if (!isPhase(phase)) throw new Error(`Invalid phase: ${phase}`);
    if (!isTaskSetId(taskSetId)) throw new Error(`Invalid taskSetId: ${taskSetId}`);
    if (!isTaskVersion(taskVersion))
        throw new Error(`Invalid taskVersion: ${taskVersion}`);

    const strategy = sp.strategy;
    const flowId = sp.flowId;
    const variant = sp.variant;

    if (!strategy || !isStrategy(strategy))
        throw new Error(`Invalid strategy: ${String(strategy)}`);
    if (!flowId) throw new Error("Missing flowId");
    if (!variant || !isVariant(variant))
        throw new Error(`Invalid variant: ${String(variant)}`);

    return {
        phase,
        taskSetId,
        taskVersion,
        trialId,
        strategy,
        flowId,
        variant,
    };
}
