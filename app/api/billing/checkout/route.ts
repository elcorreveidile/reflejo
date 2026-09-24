import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { planById, billingBaseUrl } from "@/lib/billing";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "no-stripe" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { plan?: string };
  const def = planById(body.plan);
  if (!def || !def.priceId) return NextResponse.json({ error: "bad-plan" }, { status: 400 });

  try {
    // Cliente de Stripe reutilizable por usuario.
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { id: true, email: true, stripeCustomerId: true },
    });
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

    let customerId = user.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const base = billingBaseUrl(req);
    const checkout = await stripe.checkout.sessions.create({
      mode: def.mode,
      customer: customerId,
      line_items: [{ price: def.priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { userId: user.id, plan: def.id },
      ...(def.mode === "subscription"
        ? { subscription_data: { metadata: { userId: user.id, plan: def.id } } }
        : { payment_intent_data: { metadata: { userId: user.id, plan: def.id } } }),
      allow_promotion_codes: true,
      success_url: `${base}/plus?ok=1`,
      cancel_url: `${base}/plus?cancel=1`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("checkout", e);
    return NextResponse.json({ error: "stripe" }, { status: 500 });
  }
}
