import { track } from "@/lib/logger/track";

export default function Home() {
  async function handleClick() {
    "use server";
    await track(
      {
        phase: "pre",
        taskSetId: "A",
        taskVersion: "A",
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

  return (
    <form action={handleClick}>
      <button type="submit">track() テスト</button>
    </form>
  );
}
