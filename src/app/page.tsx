import { track } from "@/lib/logger/track";
import Link from "next/link";

function buildUrl() {
  const phase = "pre";
  const taskSetId = "A";
  const taskVersion = "A1";
  const trialId = "t000";

  const qs = new URLSearchParams({
    strategy: "misleading",
    flowId: "misleading_01",
    variant: "A",
  });

  return `/${phase}/${taskSetId}/${taskVersion}/${trialId}/product?${qs.toString()}`;
}

export default function Home() {
  async function handleClick() {
    "use server";
    await track(
      {
        phase: "pre",
        taskSetId: "A",
        taskVersion: "A1",
        trialId: "t000",
        strategy: "misleading",
        flowId: "misleading_01",
        variant: "A",
      },
      {
        page: "product",
        type: "button_click",
        payload: { buttonId: "home.test" },
      }
    );
  }

  const first = buildUrl();

  return (
    <>
      <form action={handleClick}>
        <button type="submit">track() テスト</button>
      </form>
      <p className="text-sm text-gray-600">
        ルートで試行順を決め、動的ルートへ遷移します（Commit4）。
      </p>

      <Link href={first} className="inline-block rounded bg-black px-4 py-2 text-white">
        開始（t000へ）
      </Link>

      <div className="text-xs text-gray-500 break-words">遷移先: {first}</div>
    </>
  );
}
