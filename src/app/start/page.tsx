"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartPage() {
  const [pid, setPid] = useState("");
  const router = useRouter();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">実験開始</h1>
      <p className="text-sm text-gray-600">被験者ID（pid）を入力して開始します。</p>

      <input
        className="w-full max-w-sm rounded border p-2 text-sm"
        placeholder="例: id001"
        value={pid}
        onChange={(e) => setPid(e.target.value)}
      />

      <button
        type="button"
        className="rounded bg-black px-4 py-2 text-sm text-white"
        onClick={() => {
          const v = pid.trim();
          if (!v) {
            alert("被験者IDを入力してください");
            return;
          }
          // まず Home に渡す（Home から各trialにpid付きで入れる）
          router.push(`/home/?pid=${encodeURIComponent(v)}`);
        }}
      >
        次へ
      </button>
    </main>
  );
}
