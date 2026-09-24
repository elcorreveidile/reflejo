import type { NextRequest } from "next/server";

export type PlanId = "sub" | "lifetime";

export interface PlanDef {
  id: PlanId;
  mode: "subscription" | "payment";
  priceId?: string;
}

/** Definición de los planes. El precio real vive en Stripe (id de precio por env). */
export function planDefs(): PlanDef[] {
  return [
    { id: "sub", mode: "subscription", priceId: process.env.STRIPE_PRICE_SUB },
    { id: "lifetime", mode: "payment", priceId: process.env.STRIPE_PRICE_LIFETIME },
  ];
}

export function planById(id: string | undefined | null): PlanDef | undefined {
  return planDefs().find((p) => p.id === id);
}

/** Base pública para las URLs de retorno de Stripe. */
export function billingBaseUrl(req: NextRequest): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/$/, "");
  return req.nextUrl.origin;
}
