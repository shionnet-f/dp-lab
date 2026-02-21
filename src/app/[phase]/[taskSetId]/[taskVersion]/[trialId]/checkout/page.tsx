import CheckoutClient from "./CheckoutClient";
import { getTrialMeta } from "@/lib/logger/getTrialMeta";
import { track } from "@/lib/logger/track";
import { redirect } from "next/navigation";

type SearchParams = {
  productId?: string;
  shippingId?: string;
  addonGiftWrap?: string;
};

type Props = {
  params:
    | { phase: string; taskSetId: string; taskVersion: string; trialId: string }
    | Promise<{ phase: string; taskSetId: string; taskVersion: string; trialId: string }>;
  searchParams?: SearchParams | Promise<SearchParams>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;

  const trial = getTrialMeta(p);

  const productId = sp?.productId;
  if (!productId) {
    // ✅ Commit08: unknownを残さない
    throw new Error("Missing productId in checkout");
  }

  const baseUrl = `/${p.phase}/${p.taskSetId}/${p.taskVersion}/${p.trialId}`;

  const initialShippingId = sp?.shippingId ?? "normal";
  const initialAddonGiftWrap = sp?.addonGiftWrap === "true";

  // --- server actions（clientに渡す） ---
  async function logPageView() {
    "use server";
    await track(trial, { page: "checkout", type: "page_view", payload: { productId } });
  }

  async function logDetailOpen(target: "shipping" | "addon") {
    "use server";
    await track(trial, { page: "checkout", type: "detail_open", payload: { target, productId } });
  }

  async function logDetailClose(target: "shipping" | "addon") {
    "use server";
    await track(trial, { page: "checkout", type: "detail_close", payload: { target, productId } });
  }

  async function logOptionChange(field: "shipping" | "addon_gift_wrap", value: string | boolean) {
    "use server";
    await track(trial, {
      page: "checkout",
      type: "option_change",
      payload: { productId, field, value },
    });
  }

  async function logSubmitCheckout(finalShippingId: string, finalAddonGiftWrap: boolean) {
    "use server";
    await track(trial, {
      page: "checkout",
      type: "submit_checkout",
      payload: { productId, finalShippingId, finalAddonGiftWrap },
    });
  }

  async function logClickTerms() {
    "use server";
    await track(trial, { page: "checkout", type: "click_terms", payload: { productId } });
  }

  async function backToProduct() {
    "use server";
    await track(trial, {
      page: "checkout",
      type: "back_to_product",
      payload: { productId },
    });
    redirect(`${baseUrl}/product`);
  }

  return (
    <CheckoutClient
      baseUrl={baseUrl}
      productId={productId}
      initialShippingId={initialShippingId}
      initialAddonGiftWrap={initialAddonGiftWrap}
      logPageView={logPageView}
      logDetailOpen={logDetailOpen}
      logDetailClose={logDetailClose}
      logOptionChange={logOptionChange}
      logSubmitCheckout={logSubmitCheckout}
      logClickTerms={logClickTerms}
      backToProduct={backToProduct}
    />
  );
}
