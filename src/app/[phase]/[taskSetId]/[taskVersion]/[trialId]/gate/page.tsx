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

  const baseTrial = getTrialMeta(p);
  const trial = { ...baseTrial, participantId: pid, trialRunId: rid };

  const productId = sp?.productId;
  if (!productId) throw new Error("Missing productId in gate");

  const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;
  const fallback = `${baseUrl}/terms?` + new URLSearchParams({ pid, rid, productId }).toString();
  const returnTo = sp?.returnTo ?? fallback;

  async function proceed() {
    "use server";
    await track(trial, { page: "gate", type: "obstruction_gate_proceed", payload: { productId } });
    redirect(returnTo);
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">確認</h1>
      <p className="text-sm text-gray-700">重要条件の確認に進む前に、注意事項をご確認ください。</p>

      <form action={proceed}>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          続ける
        </button>
      </form>
    </main>
  );
}
