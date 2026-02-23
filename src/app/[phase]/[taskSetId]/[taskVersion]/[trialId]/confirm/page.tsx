import { redirect } from "next/navigation";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";
import { saveTrialSummary } from "@/lib/logger/saveTrialSummary";
import { hasViewedTerms } from "@/lib/logger/hasViewedTerms";
import { calcTotalTimeMs } from "@/lib/logger/calcTotalTimeMs";
import { requirePid } from "@/lib/logger/requirePid";
import { requireRid } from "@/lib/logger/requireRid";

type SearchParams = {
  pid?: string;
  rid?: string;

  productId?: string;
  shippingId?: string;
  addonGiftWrap?: string;
};

type Props = {
  params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
  searchParams?: SearchParams | Promise<SearchParams>;
};

function yen(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n);
}

const PRODUCT_PRICE_YEN = 1980;
const SHIPPING_PRICE: Record<string, number> = { normal: 0, express: 800 };
const ADDON_PRICE_YEN = 500;

export default async function ConfirmPage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;

  const pid = requirePid(sp);
  const rid = requireRid(sp);

  const trial = getTrialMeta(p);
  const trialWithRun = { ...trial, participantId: pid, trialRunId: rid };

  const isPressure = trial.strategy === "pressure";
  const isObstruction = trial.strategy === "obstruction";

  const productId = sp?.productId;
  if (!productId) throw new Error("Missing productId in confirm");

  const shippingId = sp?.shippingId ?? "normal";
  const addonGiftWrap = sp?.addonGiftWrap === "true";

  const shippingPrice = SHIPPING_PRICE[shippingId] ?? 0;
  const addonPrice = addonGiftWrap ? ADDON_PRICE_YEN : 0;
  const total = PRODUCT_PRICE_YEN + shippingPrice + addonPrice;

  const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;

  async function logPageView() {
    "use server";
    await track(trialWithRun, {
      page: "confirm",
      type: "page_view",
      payload: { productId, shippingId, addonGiftWrap },
    });
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">注文内容の確認</h1>

      {isPressure ? (
        <div className="rounded border bg-yellow-50 p-3 text-sm text-gray-800">
          <div className="font-semibold">本日中の手続きがおすすめです</div>
          <div className="text-xs text-gray-600">
            混雑状況により条件確認に時間がかかる場合があります。
          </div>
        </div>
      ) : null}

      <div className="text-xs text-gray-500 break-words">
        pid: {pid} / rid: {rid} / trial: {p.phase}/{p.taskSetId}/{p.taskVersion}/{p.trialId}
      </div>

      <form action={logPageView}>
        <button type="submit" className="text-sm underline text-gray-700">
          page_view を記録（テスト）
        </button>
      </form>

      <section className="rounded border bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">明細</div>
          <form
            action={async () => {
              "use server";
              await track(trialWithRun, {
                page: "confirm",
                type: "click_expand_breakdown",
                payload: { productId },
              });
            }}
          >
            <button type="submit" className="text-sm underline text-gray-700">
              明細を確認（ログ）
            </button>
          </form>
        </div>

        <div className="text-sm text-gray-700">商品: ¥{yen(PRODUCT_PRICE_YEN)}</div>
        <div className="text-sm text-gray-700">
          配送: {shippingId}（¥{yen(shippingPrice)}）
        </div>
        <div className="text-sm text-gray-700">
          ギフト包装: {addonGiftWrap ? "ON" : "OFF"}（¥{yen(addonPrice)}）
        </div>
        <div className="pt-2 border-t font-semibold">合計: ¥{yen(total)}</div>
      </section>

      <div className="flex flex-wrap gap-3">
        {/* checkoutへ戻る */}
        <form
          action={async () => {
            "use server";
            await track(trialWithRun, {
              page: "confirm",
              type: "back_to_checkout",
              payload: { productId },
            });

            const qs = new URLSearchParams({
              pid,
              rid,
              productId,
              shippingId,
              addonGiftWrap: String(addonGiftWrap),
            });

            redirect(`${baseUrl}/checkout?${qs.toString()}`);
          }}
        >
          <button type="submit" className="rounded border px-3 py-2 text-sm">
            配送・オプションを変更する
          </button>
        </form>

        {/* termsへ */}
        <form
          action={async () => {
            "use server";
            await track(trialWithRun, {
              page: "confirm",
              type: "go_terms",
              payload: { productId },
            });

            const qsConfirm = new URLSearchParams({
              pid,
              rid,
              productId,
              shippingId,
              addonGiftWrap: String(addonGiftWrap),
            });

            const returnTo = `${baseUrl}/confirm?${qsConfirm.toString()}`;

            if (isObstruction) {
              const qs = new URLSearchParams({ pid, rid, productId, returnTo });
              redirect(`${baseUrl}/gate?${qs.toString()}`);
            }

            const qs = new URLSearchParams({ pid, rid, productId, returnTo });
            redirect(`${baseUrl}/terms?${qs.toString()}`);
          }}
        >
          <button type="submit" className="rounded border px-3 py-2 text-sm">
            重要条件を見る（terms）
          </button>
        </form>
      </div>

      {/* 確定 */}
      <form
        action={async () => {
          "use server";

          const confirmedImportantInfo = await hasViewedTerms(trialWithRun);
          const totalTimeMs = await calcTotalTimeMs(trialWithRun);

          await track(trialWithRun, {
            page: "confirm",
            type: "submit_confirm",
            payload: { productId, shippingId, addonGiftWrap, totalYen: total },
          });

          const isInappropriate = !confirmedImportantInfo;

          await saveTrialSummary({
            meta: trialWithRun,
            isInappropriate,
            confirmedImportantInfo,
            totalTimeMs,
            extras: { pid, rid, productId, shippingId, addonGiftWrap, totalYen: total },
          });

          // 次の試行へ
          redirect(`${baseUrl}/product?` + new URLSearchParams({ pid }).toString());
        }}
      >
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          この内容で確定（ログ）
        </button>
      </form>
    </main>
  );
}
