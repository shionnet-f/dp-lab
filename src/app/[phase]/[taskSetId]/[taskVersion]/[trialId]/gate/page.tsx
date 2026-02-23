import { redirect } from "next/navigation";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";
import { requirePid } from "@/lib/logger/requirePid";
import { requireRid } from "@/lib/logger/requireRid";

type SearchParams = { pid?: string; rid?: string; productId?: string; returnTo?: string };
type Props = {
  params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
  searchParams?: SearchParams | Promise<SearchParams>;
};

export default async function GatePage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;

  const pid = requirePid(sp);
  const rid = requireRid(sp);

  const trial = getTrialMeta(p);
  const trialWithRun = { ...trial, participantId: pid, trialRunId: rid };

  const productId = sp?.productId;
  if (!productId) throw new Error("Missing productId in gate");

  const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;
  const returnTo =
    sp?.returnTo ?? `${baseUrl}/terms?` + new URLSearchParams({ pid, rid, productId }).toString();

  async function proceed() {
    "use server";
    await track(trialWithRun, {
      page: "confirm",
      type: "obstruction_gate_proceed",
      payload: { productId },
    });
    redirect(returnTo);
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">確認</h1>
      <p className="text-sm text-gray-700">重要条件の確認に進む前に、注意事項をご確認ください。</p>
      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        <li>画面遷移には数秒かかる場合があります。</li>
        <li>条件確認後は元の画面に戻れます。</li>
      </ul>

      <form action={proceed}>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          続ける
        </button>
      </form>
    </main>
  );
}
