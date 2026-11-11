import "server-only";
import { platformCollection } from "@/shared/db/platform";
import type { PlanId } from "../domain/plans";

/**
 * Which Razorpay plan sells each of our prices, per mode: test and live
 * plans are different objects in Razorpay. The _id is mode, plan and price,
 * so the same price is only ever linked once (two people at once included).
 */
type RazorpayPlanDoc = {
  _id: string;
  mode: "test" | "live";
  planId: PlanId;
  monthlyPrice: number;
  razorpayPlanId: string;
  createdAt: Date;
};

const links = () => platformCollection<RazorpayPlanDoc>("razorpayPlans");
const key = (mode: string, planId: PlanId, price: number) =>
  `${mode}:${planId}:${price}`;

export async function findRazorpayPlanLink(
  mode: "test" | "live",
  planId: PlanId,
  monthlyPrice: number,
): Promise<string | null> {
  const doc = await links().findOne({ _id: key(mode, planId, monthlyPrice) });
  return doc?.razorpayPlanId ?? null;
}

/** Links a price; if someone linked it first, returns their plan. */
export async function saveRazorpayPlanLink(
  mode: "test" | "live",
  planId: PlanId,
  monthlyPrice: number,
  razorpayPlanId: string,
): Promise<string> {
  const _id = key(mode, planId, monthlyPrice);
  try {
    await links().insertOne({
      _id,
      mode,
      planId,
      monthlyPrice,
      razorpayPlanId,
      createdAt: new Date(),
    });
    return razorpayPlanId;
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const existing = await links().findOne({ _id });
    return existing?.razorpayPlanId ?? razorpayPlanId;
  }
}

/** Which of our plans a Razorpay plan sells (old prices included). */
export async function findPlanIdForRazorpay(
  razorpayPlanId: string,
): Promise<PlanId | null> {
  const doc = await links().findOne({ razorpayPlanId });
  return doc?.planId ?? null;
}
