import { redirect } from "next/navigation";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";

type SearchParams = { productId?: string };

type Props = {
  params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
  searchParams?: SearchParams | Promise<SearchParams>;
};

export default async function TermsPage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;

  const trial = getTrialMeta(p);

  const productId = sp?.productId;
  if (!productId) throw new Error("Missing productId in terms");

  const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">重要条件</h1>

      <section className="rounded border bg-white p-4 space-y-2 text-sm text-gray-800">
        <p className="font-semibold">重要条件（例）</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>定期購入の場合、2回目以降の請求条件が異なる場合があります。</li>
          <li>解約はマイページから手続きが必要です（締切あり）。</li>
          <li>返金条件は商品ごとに異なります。</li>
        </ul>
      </section>

      <form
        action={async () => {
          "use server";
          await track(trial, {
            page: "terms",
            type: "back_to_checkout",
            payload: { productId },
          });
          redirect(`${baseUrl}/checkout?productId=${encodeURIComponent(productId)}`);
        }}
      >
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          戻る
        </button>
      </form>
    </main>
  );
}
