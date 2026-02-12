import Link from "next/link";

function buildUrl() {
  const phase = "pre";
  const taskSetId = "A";
  const taskVersion = "A1";
  const trialId = "t000";

  return `/${phase}/${taskSetId}/${taskVersion}/${trialId}/product`;
}

export default function Home() {
  const first = buildUrl();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">dp-lab 実験課題</h1>

      <p className="text-sm text-gray-600">
        ルートで試行順を決め、動的ルートへ遷移します（Commit5）。
      </p>

      <Link href={first} className="inline-block rounded bg-black px-4 py-2 text-white">
        開始（t000へ）
      </Link>

      <div className="text-xs text-gray-500 break-words">遷移先: {first}</div>
    </main>
  );
}
