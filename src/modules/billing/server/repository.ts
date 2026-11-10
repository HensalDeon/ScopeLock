import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { platformCollection } from "@/shared/db/platform";
import { paise } from "@/shared/lib/money";
import type { Plan, PlanId } from "../domain/plans";

/**
 * Platform-level collections (not per workspace): the plans, and their
 * insert-only price history. Reached through platformCollection(), never the raw helper.
 */
type PlanDoc = Omit<Plan, "id" | "monthlyPrice"> & {
  _id: PlanId;
  monthlyPrice: number;
  updatedAt: Date;
  updatedBy: string;
};

type PriceDoc = {
  _id?: ObjectId;
  planId: PlanId;
  monthlyPrice: number;
  /** The Razorpay plan this price is sold as (set once Razorpay is on). */
  razorpayPlanId: string | null;
  createdAt: Date;
  createdBy: string;
};

const plans = () => platformCollection<PlanDoc>("plans");
const prices = () => platformCollection<PriceDoc>("planPrices");

const toPlan = (doc: PlanDoc): Plan => ({
  id: doc._id,
  name: doc.name,
  summary: doc.summary,
  monthlyPrice: paise(doc.monthlyPrice),
  activeProjects: doc.activeProjects,
  teamMembers: doc.teamMembers,
  features: doc.features,
  highlights: doc.highlights,
});

export async function findPlans(): Promise<Plan[]> {
  return (await plans().find({}).toArray()).map(toPlan);
}

export async function savePlanDoc(
  plan: Plan,
  by: string,
  session?: ClientSession,
): Promise<void> {
  const { id, ...rest } = plan;
  await plans().replaceOne(
    { _id: id },
    {
      ...rest,
      monthlyPrice: plan.monthlyPrice,
      updatedAt: new Date(),
      updatedBy: by,
    },
    { upsert: true, session },
  );
}

/** A new price for a plan (prices are never edited, only added). */
export async function addPrice(
  planId: PlanId,
  monthlyPrice: number,
  by: string,
  session?: ClientSession,
  createdAt = new Date(),
): Promise<void> {
  await prices().insertOne(
    { planId, monthlyPrice, razorpayPlanId: null, createdAt, createdBy: by },
    { session },
  );
}

export async function hasPriceHistory(
  planId: PlanId,
  session?: ClientSession,
): Promise<boolean> {
  return (await prices().countDocuments({ planId }, { limit: 1, session })) > 0;
}

export async function findPriceHistory(planId: PlanId): Promise<
  {
    monthlyPrice: number;
    razorpayPlanId: string | null;
    createdAt: Date;
    createdBy: string;
  }[]
> {
  return (
    await prices()
      .find({ planId }, { sort: { createdAt: -1 }, limit: 20 })
      .toArray()
  ).map(({ monthlyPrice, razorpayPlanId, createdAt, createdBy }) => ({
    monthlyPrice,
    razorpayPlanId,
    createdAt,
    createdBy,
  }));
}
