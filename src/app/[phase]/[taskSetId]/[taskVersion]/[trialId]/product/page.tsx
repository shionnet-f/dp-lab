import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";

type Props = {
    params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
};

export default async function ProductPage({ params }: Props) {
    const p = await params;

    async function handleClick() {
        "use server";
        const trial = getTrialMeta(p);

        await track(trial, {
            page: "product",
            type: "button_click",
            payload: { buttonId: "product.test" },
        });
    }

    return (
        <main className="p-6 space-y-4">
            <h1 className="text-xl font-bold">Product（テスト）</h1>

            <div className="text-sm text-gray-600 break-words">
                URL params: {JSON.stringify(p)}
            </div>

            <form action={handleClick}>
                <button className="rounded bg-black px-4 py-2 text-white" type="submit">
                    track() テスト（trialMeta自動）
                </button>
            </form>
        </main>
    );
}
