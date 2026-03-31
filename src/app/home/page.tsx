import Link from "next/link";

const trials = [
  { trialId: "t000", label: "t000 misleading_01（おすすめ強調）" },
  { trialId: "t001", label: "t001 omission_01（重要導線を弱める）" },
  { trialId: "t002", label: "t002 pressure_01（急がせる）" },
  { trialId: "t003", label: "t003 obstruction_01（到達を面倒にする）" },
] as const;

type SearchParams = { pid?: string };

function buildUrl(trialId: string, pid: string) {
  const phase = "pre";
  const taskSetId = "A";
  const taskVersion = "A1";
  return `/${phase}/${taskSetId}/${taskVersion}/${trialId}/product?pid=${encodeURIComponent(pid)}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const pid = sp?.pid?.trim();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">dp-lab 実験課題</h1>

      {!pid ? (
        <div className="rounded border bg-yellow-50 p-3 text-sm text-gray-800">
          pid が未設定です。
          <Link className="underline" href="/start">
            /start
          </Link>{" "}
          から開始してください。
        </div>
      ) : (
        <p className="text-sm text-gray-600">pid: {pid}</p>
      )}

      <div className="space-y-2">
        {trials.map((t) => {
          const href = pid ? buildUrl(t.trialId, pid) : "/start";
          return (
            <div
              key={t.trialId}
              className="rounded border bg-white p-3 flex items-center justify-between"
            >
              <div className="text-sm">{t.label}</div>
              <Link href={href} className="rounded bg-black px-3 py-2 text-sm text-white">
                開始
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}
