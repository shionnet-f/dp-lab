import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Admin</h1>

      <div>
        <Link
          href="/admin/export/trial-summary"
          className="inline-block rounded bg-black px-4 py-2 text-sm text-white"
        >
          TrialSummary CSV をダウンロード
        </Link>
        <br />
        <br />

        <Link
          href="/admin/export/event-log"
          className="inline-block rounded bg-black px-4 py-2 text-sm text-white"
        >
          EventLog CSV をダウンロード
        </Link>
      </div>
    </main>
  );
}
