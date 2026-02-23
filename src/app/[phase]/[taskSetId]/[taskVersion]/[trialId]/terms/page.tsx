import { redirect } from "next/navigation";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";
import TermsViewLogger from "./TermsViewLogger";
import { requirePid } from "@/lib/logger/requirePid";
import { requireRid } from "@/lib/logger/requireRid";

type SearchParams = { pid?: string; rid?: string; productId?: string; returnTo?: string };

type Props = {
  params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
  searchParams?: SearchParams | Promise<SearchParams>;
};

export default async function TermsPage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;

  const pid = requirePid(sp);
  const rid = requireRid(sp);

  const trial = getTrialMeta(p);
  const trialWithRun = { ...trial, participantId: pid, trialRunId: rid };

  const productId = sp?.productId;
  if (!productId) throw new Error("Missing productId in terms");

  const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;

  const fallback = `${baseUrl}/confirm?` + new URLSearchParams({ pid, rid, productId }).toString();
  const returnTo = sp?.returnTo ?? fallback;

  const ok =
    returnTo.startsWith(`${baseUrl}/confirm`) || returnTo.startsWith(`${baseUrl}/checkout`);

  if (!ok) throw new Error("Invalid returnTo in terms");

  async function logView() {
    "use server";
    await track(trialWithRun, { page: "terms", type: "view_terms", payload: { productId } });
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">解約・重要条件</h1>

      <div className="text-xs text-gray-500 break-words">
        pid: {pid} / rid: {rid}
      </div>

      <TermsViewLogger logView={logView} />

      <form action={logView}>
        <button type="submit" className="text-sm underline text-gray-700">
          view_terms を記録（テスト）
        </button>
      </form>

      <section className="rounded border bg-white p-4 space-y-3 text-sm text-gray-800">
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
          await track(trialWithRun, {
            page: "terms",
            type: "back_to_previous",
            payload: { productId },
          });
          redirect(returnTo);
        }}
      >
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          戻る
        </button>
      </form>
    </main>
  );
}
