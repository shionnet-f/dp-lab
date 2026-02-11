import { logEvent } from "@/lib/logger/logEvent";

export default function Home() {
  async function handleClick() {
    "use server";

    await logEvent({
      ts: Date.now(),
      page: "home",
      type: "test_click",
      meta: { test: true },
    });
  }

  return (
    <form action={handleClick}>
      <button type="submit">テストログ保存</button>
    </form>
  );
}
