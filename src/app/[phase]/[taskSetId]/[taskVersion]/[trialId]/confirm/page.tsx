// src/app/[phase]/[taskSetId]/[taskVersion]/[trialId]/confirm/page.tsx
import Link from "next/link";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";

type SearchParams = {
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

export default async function ConfirmPage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;

  const trial = getTrialMeta(p);

  const productId = sp?.productId;
  if (!productId) throw new Error("Missing productId in confirm");

  const shippingId = sp?.shippingId ?? "normal";
  const addonGiftWrap = sp?.addonGiftWrap === "true";

  const shippingPrice = SHIPPING_PRICE[shippingId] ?? 0;
  const addonPrice = addonGiftWrap ? 500 : 0;
  const total = PRODUCT_PRICE_YEN + shippingPrice + addonPrice;

  const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;

  async function logPageView() {
    "use server";
    await track(trial, { page: "confirm", type: "page_view", payload: { productId } });
  }

  async function logExpand() {
    "use server";
    await track(trial, { page: "confirm", type: "click_expand_breakdown", payload: { productId } });
  }

  async function logBack() {
    "use server";
    await track(trial, { page: "confirm", type: "back_click", payload: { productId } });
  }

  async function logSubmit() {
    "use server";
    await track(trial, {
      page: "confirm",
      type: "confirm_submit",
      payload: {
        productId,
        finalShippingId: shippingId,
        finalAddonGiftWrap: addonGiftWrap,
        total,
      },
    });
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">ご注文内容の確認</h1>

      <form action={logPageView}>
        <button type="submit" className="text-sm underline text-gray-700">
          page_view を記録（テスト）
        </button>
      </form>

      <section className="rounded border bg-white p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="font-semibold">注文内訳</div>
          <form action={logExpand}>
            <button type="submit" className="text-sm underline text-blue-600">
              明細を確認
            </button>
          </form>
        </div>

        <div className="text-sm text-gray-700 space-y-1">
          <div>商品: ¥{yen(PRODUCT_PRICE_YEN)}</div>
          <div>配送: ¥{yen(shippingPrice)}</div>
          <div>オプション: ¥{yen(addonPrice)}</div>
        </div>

        <div className="border-t pt-2 font-semibold">合計: ¥{yen(total)}</div>
      </section>

      <Link
        href={`${baseUrl}/checkout?productId=${encodeURIComponent(productId)}`}
        className="text-sm underline"
      >
        戻る（checkoutへ）
      </Link>

      <form action={logBack}>
        <button type="submit" className="text-xs underline text-gray-500">
          back_click を記録（テスト）
        </button>
      </form>

      <form action={logSubmit}>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          注文を確定する（confirm_submit）
        </button>
      </form>
    </main>
  );
}
