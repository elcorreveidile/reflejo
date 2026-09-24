import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function periodEnd(sub: Stripe.Subscription): Date | null {
  // El fin de periodo vive a veces en el item y a veces en la raíz, según la versión de API.
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  const root = sub as unknown as { current_period_end?: number };
  const sec = item?.current_period_end ?? root.current_period_end;
  return typeof sec === "number" ? new Date(sec * 1000) : null;
}

async function updateByUser(userId: string | undefined, customerId: string | undefined, data: Record<string, unknown>) {
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data }).catch(async () => {
      if (customerId) await prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data });
    });
    return;
  }
  if (customerId) await prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "no-stripe" }, { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", secret);
  } catch (e) {
    console.error("webhook signature", e);
    return NextResponse.json({ error: "bad-signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId ?? s.client_reference_id ?? undefined;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const plan = s.metadata?.plan ?? (s.mode === "subscription" ? "sub" : "lifetime");
        const data: Record<string, unknown> = { plus: true, plan, stripeCustomerId: customerId };
        if (s.mode === "payment") data.plusUntil = null; // compra única: para siempre
        await updateByUser(userId, customerId, data);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId ?? undefined;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        const active = sub.status === "active" || sub.status === "trialing";
        await updateByUser(userId, customerId, {
          plus: active,
          plan: active ? "sub" : null,
          plusUntil: periodEnd(sub),
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId ?? undefined;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        await updateByUser(userId, customerId, { plus: false, plan: null, plusUntil: periodEnd(sub) });
        break;
      }
      case "invoice.paid": {
        // Renovación: refresca el fin de periodo y asegura Plus activo.
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        const subId = (inv as unknown as { subscription?: string | { id: string } }).subscription;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(typeof subId === "string" ? subId : subId.id);
          await updateByUser(sub.metadata?.userId ?? undefined, customerId, {
            plus: sub.status === "active" || sub.status === "trialing",
            plan: "sub",
            plusUntil: periodEnd(sub),
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("webhook handler", event.type, e);
    return NextResponse.json({ error: "handler" }, { status: 500 }); // Stripe reintenta
  }

  return NextResponse.json({ received: true });
}
