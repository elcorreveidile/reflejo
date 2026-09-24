import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { planDefs } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface PlanInfo {
  id: string;
  mode: "subscription" | "payment";
  amount: number | null; // céntimos
  currency: string | null;
  interval: string | null; // "month" | "year" | null
}

/** Precios reales desde Stripe, para que la UI no invente importes. */
export async function GET() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ configured: false, plans: [] as PlanInfo[] });

  const defs = planDefs().filter((d) => d.priceId);
  const plans: PlanInfo[] = [];
  for (const d of defs) {
    try {
      const price = await stripe.prices.retrieve(d.priceId!);
      plans.push({
        id: d.id,
        mode: d.mode,
        amount: price.unit_amount ?? null,
        currency: price.currency ?? null,
        interval: price.recurring?.interval ?? null,
      });
    } catch {
      // precio mal configurado: se omite del listado
    }
  }
  return NextResponse.json({ configured: plans.length > 0, plans });
}
