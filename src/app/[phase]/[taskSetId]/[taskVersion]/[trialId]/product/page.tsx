import DetailModal from "@/app/components/DetailModal";
import { products6 } from "@/config/products";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
};

function yen(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n);
}

export default async function ProductPage({ params }: Props) {
  const p = await params;
  const trial = getTrialMeta(p);

  // misleading_01 : p1 を強調
  const recommendedId = "p1";

  async function logClickProduct(productId: string) {
    "use server";
    await track(trial, { page: "product", type: "click_product", payload: { productId } });
  }

  async function logDetailOpen(productId: string) {
    "use server";
    await track(trial, { page: "product", type: "detail_open", payload: { productId } });
  }

  async function logDetailClose(productId: string) {
    "use server";
    await track(trial, { page: "product", type: "detail_close", payload: { productId } });
  }

  async function logSubmitSelect(productId: string) {
    "use server";
    await track(trial, { page: "product", type: "submit_select", payload: { productId } });
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">商品一覧</h1>

      <div className="grid grid-cols-3 gap-4">
        {products6.map((product) => {
          const isRecommended = product.id === recommendedId;

          return (
            <div
              key={product.id}
              className={[
                "rounded-lg border bg-white p-4 space-y-3",
                isRecommended ? "border-blue-500 shadow-lg" : "shadow-sm",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                  <div className="text-sm text-gray-600">¥{yen(product.priceYen)}</div>
                </div>

                {isRecommended ? (
                  <span className="shrink-0 rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                    おすすめ
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <form action={logClickProduct.bind(null, product.id)}>
                  <button type="submit" className="underline text-blue-700">
                    カードをクリック（ログ）
                  </button>
                </form>

                {/* モーダル */}
                <DetailModal
                  title={`${product.name} の詳細`}
                  triggerLabel="詳細を見る"
                  onOpen={logDetailOpen.bind(null, product.id)}
                  onClose={logDetailClose.bind(null, product.id)}
                >
                  <div className="space-y-3">
                    <div className="text-gray-800">{product.description}</div>

                    {/* 重要条件(将来的にomission_01で使うかも) */}
                    <div className="rounded border bg-gray-50 p-3 text-xs text-gray-700">
                      <div className="font-semibold">重要条件（例）</div>
                      <ul className="mt-1 list-disc pl-5 space-y-1">
                        <li>解約条件は別途確認が必要です</li>
                        <li>定期購入の場合、初回価格と2回目以降の条件が異なる場合があります</li>
                      </ul>
                    </div>
                  </div>
                </DetailModal>
              </div>

              <form
                action={async () => {
                  "use server";

                  await track(trial, {
                    page: "product",
                    type: "select_product",
                    payload: { productId: product.id },
                  });

                  redirect(
                    `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}/checkout?productId=${encodeURIComponent(product.id)}`,
                  );
                }}
              >
                <button
                  type="submit"
                  className="block w-full rounded bg-black px-3 py-2 text-center text-white"
                >
                  この商品を選ぶ
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}
