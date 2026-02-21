"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function yen(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n);
}

const shippingOptions = [
  { id: "normal", title: "通常配送", priceYen: 0, note: "3〜5日でお届け" },
  { id: "express", title: "お急ぎ便", priceYen: 800, note: "最短翌日でお届け" },
] as const;

type Props = {
  baseUrl: string;
  productId: string;

  // server actions（serverから渡す）
  logPageView: () => Promise<void>;
  logDetailOpen: (target: "shipping" | "addon") => Promise<void>;
  logDetailClose: (target: "shipping" | "addon") => Promise<void>;
  logOptionChange: (
    field: "shipping" | "addon_gift_wrap",
    value: string | boolean,
  ) => Promise<void>;
  logSubmitCheckout: (finalShippingId: string, finalAddonGiftWrap: boolean) => Promise<void>;
  logClickTerms: () => Promise<void>;
  backToProduct: () => Promise<void>;

  initialShippingId: string;
  initialAddonGiftWrap: boolean;

  isOmission: boolean;
};

export default function CheckoutClient({
  baseUrl,
  productId,
  logPageView,
  logDetailOpen,
  logDetailClose,
  logOptionChange,
  logSubmitCheckout,
  logClickTerms,
  backToProduct,
  initialShippingId,
  initialAddonGiftWrap,
  isOmission,
}: Props) {
  const router = useRouter();

  const [shippingId, setShippingId] = useState(initialShippingId);
  const [addonGiftWrap, setAddonGiftWrap] = useState(initialAddonGiftWrap);

  const shippingPrice = useMemo(() => {
    const s = shippingOptions.find((x) => x.id === shippingId);
    return s?.priceYen ?? 0;
  }, [shippingId]);

  const addonPrice = addonGiftWrap ? 500 : 0;
  const productPrice = 1980;
  const total = productPrice + shippingPrice + addonPrice;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">配送・オプション</h1>

      <div className="text-sm text-gray-600">productId: {productId}</div>

      <button
        className="text-sm underline text-gray-700"
        onClick={() => void logPageView()}
        type="button"
      >
        page_view を記録（テスト）
      </button>

      {/* 配送 */}
      <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">配送方法</h2>

          <button
            type="button"
            className="text-sm underline text-gray-700"
            onClick={async () => {
              await logDetailOpen("shipping");
              alert("配送の詳細（仮）");
              await logDetailClose("shipping");
            }}
          >
            詳細（ログ）
          </button>
        </div>

        <div className="space-y-2">
          {shippingOptions.map((s) => (
            <label key={s.id} className="flex items-start gap-3 rounded border p-3">
              <input
                type="radio"
                name="shippingId"
                value={s.id}
                checked={shippingId === s.id}
                onChange={async () => {
                  setShippingId(s.id);
                  await logOptionChange("shipping", s.id);
                }}
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
        </div>
      </section>

      {/* オプション */}
      <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">オプション</h2>

          <button
            type="button"
            className="text-sm underline text-gray-700"
            onClick={async () => {
              await logDetailOpen("addon");
              alert("オプションの詳細（仮）");
              await logDetailClose("addon");
            }}
          >
            詳細（ログ）
          </button>
        </div>

        <label className="flex items-center justify-between rounded border p-3">
          <div>
            <div className="font-medium text-gray-900">ギフト包装</div>
            <div className="text-xs text-gray-600">包装してお届けします。</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700">+¥{yen(500)}</div>
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              onClick={async () => {
                const next = !addonGiftWrap;
                setAddonGiftWrap(next);
                await logOptionChange("addon_gift_wrap", next);
              }}
            >
              {addonGiftWrap ? "ON" : "OFF"}
            </button>
          </div>
        </label>
      </section>
      <div className="text-sm">
        <button
          type="button"
          className={isOmission ? "text-xs text-gray-400 underline" : "underline text-gray-700"}
          onClick={async () => {
            await logClickTerms();
            const returnToQs = new URLSearchParams({
              productId,
              shippingId,
              addonGiftWrap: String(addonGiftWrap),
            });
            const returnTo = `${baseUrl}/checkout?${returnToQs.toString()}`;
            const qs = new URLSearchParams({ productId, returnTo });
            router.push(`${baseUrl}/terms?${qs.toString()}`);
          }}
        >
          {isOmission ? "解約条件（任意）" : "解約条件はこちら（termsへ）"}
        </button>
      </div>

      {/* 合計 */}
      <section className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
        <h2 className="font-semibold text-gray-900">合計</h2>
        <div className="text-sm text-gray-700">商品: ¥{yen(productPrice)}</div>
        <div className="text-sm text-gray-700">配送: ¥{yen(shippingPrice)}</div>
        <div className="text-sm text-gray-700">オプション: ¥{yen(addonPrice)}</div>
        <div className="pt-2 border-t font-semibold">合計: ¥{yen(total)}</div>
      </section>

      <form action={backToProduct}>
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          商品一覧へ戻る
        </button>
      </form>

      {/* 次へ */}
      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 text-white"
        onClick={async () => {
          await logSubmitCheckout(shippingId, addonGiftWrap);

          const qs = new URLSearchParams({
            productId,
            shippingId,
            addonGiftWrap: String(addonGiftWrap),
          });

          router.push(`${baseUrl}/confirm?${qs.toString()}`);
        }}
      >
        次へ（ログ→confirmへ）
      </button>
    </main>
  );
}
