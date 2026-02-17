import Link from "next/link";
import DetailModal from "@/app/components/DetailModal";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";

type Props = {
    params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
    searchParams?: { productId?: string };
};

function yen(n: number) {
    return new Intl.NumberFormat("ja-JP").format(n);
}

// 仮の価格
const PRODUCT_PRICE_YEN = 1980;

const shippingOptions = [
    { id: "normal", title: "通常配送", priceYen: 0, note: "3〜5日でお届け" },
    { id: "express", title: "お急ぎ便", priceYen: 800, note: "最短翌日でお届け" },
] as const;

export default async function CheckoutPage({ params, searchParams }: Props) {
    const p = await params;
    const trial = getTrialMeta(p);

    const productId = searchParams?.productId ?? "unknown";

    // ---- Server Actions（ログ） ----
    async function logPageView() {
        "use server";
        await track(trial, {
            page: "checkout",
            type: "page_view",
            payload: { productId },
        });
    }

    async function changeShipping(formData: FormData) {
        "use server";
        const shippingId = String(formData.get("shippingId") ?? "");
        await track(trial, {
            page: "checkout",
            type: "option_change",
            payload: { productId, field: "shipping", value: shippingId },
        });
    }

    async function changeAddon(formData: FormData) {
        "use server";
        const enabled = String(formData.get("enabled") ?? "false") === "true";
        await track(trial, {
            page: "checkout",
            type: "option_change",
            payload: { productId, field: "addon_gift_wrap", value: enabled },
        });
    }

    async function submitCheckout(formData: FormData) {
        "use server";
        const shippingId = String(formData.get("finalShippingId") ?? "");
        const addon = String(formData.get("finalAddonGiftWrap") ?? "false") === "true";

        await track(trial, {
            page: "checkout",
            type: "submit_checkout",
            payload: { productId, finalShippingId: shippingId, finalAddonGiftWrap: addon },
        });
    }

    // ---- UI（まずは中立） ----
    const defaultShippingId = "normal";
    const defaultAddon = false;

    const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;

    return (
        <main className="p-6 space-y-6">
            <h1 className="text-xl font-bold">配送・オプション</h1>

            <div className="text-sm text-gray-600">
                trial: {p.phase}/{p.taskSetId}/{p.taskVersion}/{p.trialId} / productId: {productId}
            </div>

            <form action={logPageView}>
                <button className="text-sm underline text-gray-700" type="submit">
                    page_view を記録（テスト）
                </button>
            </form>

            {/* 配送 */}
            <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">配送方法</h2>

                    <DetailModal
                        title="配送の詳細"
                        triggerLabel="詳細"
                        onOpen={async () => {
                            "use server";
                            await track(trial, {
                                page: "checkout",
                                type: "detail_open",
                                payload: { target: "shipping", productId },
                            });
                        }}
                        onClose={async () => {
                            "use server";
                            await track(trial, {
                                page: "checkout",
                                type: "detail_close",
                                payload: { target: "shipping", productId },
                            });
                        }}
                    >
                        <div className="space-y-2">
                            <p>配送方法によって到着日が異なります。</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                <li>通常配送：3〜5日</li>
                                <li>お急ぎ便：最短翌日</li>
                            </ul>
                        </div>
                    </DetailModal>
                </div>

                <form action={changeShipping} className="space-y-2">
                    {shippingOptions.map((s) => (
                        <label key={s.id} className="flex items-start gap-3 rounded border p-3">
                            <input
                                type="radio"
                                name="shippingId"
                                value={s.id}
                                defaultChecked={s.id === defaultShippingId}
                                className="mt-1"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium text-gray-900">{s.title}</div>
                                    <div className="text-sm text-gray-700">+¥{yen(s.priceYen)}</div>
                                </div>
                                <div className="mt-1 text-xs text-gray-600">{s.note}</div>
                            </div>
                        </label>
                    ))}

                    <button type="submit" className="rounded border px-3 py-2 text-sm">
                        配送変更を記録（option_change）
                    </button>
                </form>
            </section>

            {/* オプション */}
            <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">オプション</h2>

                    <DetailModal
                        title="オプションの詳細"
                        triggerLabel="詳細"
                        onOpen={async () => {
                            "use server";
                            await track(trial, {
                                page: "checkout",
                                type: "detail_open",
                                payload: { target: "addon", productId },
                            });
                        }}
                        onClose={async () => {
                            "use server";
                            await track(trial, {
                                page: "checkout",
                                type: "detail_close",
                                payload: { target: "addon", productId },
                            });
                        }}
                    >
                        <div className="space-y-2">
                            <p>ギフト包装の説明（例）。</p>
                            <p className="text-xs text-gray-600">
                                ※ omission/pressureの実装で「説明の置き場所」を変える想定。
                            </p>
                        </div>
                    </DetailModal>
                </div>

                <div className="rounded border p-3">
                    <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">ギフト包装</div>
                        <div className="text-sm text-gray-700">+¥{yen(500)}</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">包装してお届けします。</div>

                    <div className="mt-3 flex gap-3">
                        <form action={changeAddon}>
                            <input type="hidden" name="enabled" value="true" />
                            <button type="submit" className="rounded border px-3 py-2 text-sm">
                                ON（記録）
                            </button>
                        </form>

                        <form action={changeAddon}>
                            <input type="hidden" name="enabled" value="false" />
                            <button type="submit" className="rounded border px-3 py-2 text-sm">
                                OFF（記録）
                            </button>
                        </form>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                        初期状態：{defaultAddon ? "ON" : "OFF"}（中立）
                    </div>
                </div>
            </section>

            {/* 合計（簡易） */}
            <section className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
                <h2 className="font-semibold text-gray-900">合計（簡易表示）</h2>
                <div className="text-sm text-gray-700">商品: ¥{yen(PRODUCT_PRICE_YEN)}</div>
                <div className="text-sm text-gray-700">配送: （選択により変動）</div>
                <div className="text-sm text-gray-700">オプション: （選択により変動）</div>

                <div className="text-xs text-gray-500">
                    ※ omission_02（合計に即反映しない）などはここを改変して実現する想定。
                </div>
            </section>

            {/* 次へ（confirmはまだ未実装ならリンクだけでもOK） */}
            <section className="space-y-3">
                {/* submit時に “最終状態” を一旦送る（今はdefaultを送るだけ。後でClient化で改善可） */}
                <form action={submitCheckout} className="space-y-2">
                    <input type="hidden" name="finalShippingId" value={defaultShippingId} />
                    <input type="hidden" name="finalAddonGiftWrap" value={String(defaultAddon)} />

                    <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
                        次へ（submit_checkout を記録）
                    </button>
                </form>

                <Link
                    href={`${baseUrl}/confirm?productId=${encodeURIComponent(productId)}`}
                    className="text-sm underline text-gray-700"
                >
                    confirmへ移動（未実装でもリンクだけ）
                </Link>
            </section>
        </main>
    );
}
