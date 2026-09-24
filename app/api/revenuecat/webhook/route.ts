import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook de RevenueCat (cobro nativo iOS/Android). Concede el derecho `plus`
// en la cuenta, igual que el webhook de Stripe para la web, para que el
// entitlement viaje entre web y app.
//
// El `app_user_id` de RevenueCat es nuestro `User.id` (la app hace
// Purchases.logIn(uid) tras iniciar sesión). Un id anónimo de RC ($RCAnonymous…)
// no casa con ningún usuario y se ignora sin error.

interface RCEvent {
  type?: string;
  app_user_id?: string;
  expiration_at_ms?: number | null;
}

async function grant(appUserId: string | undefined, data: Record<string, unknown>) {
  if (!appUserId) return;
  // updateMany: si el id no es de un usuario real (anónimo), no afecta a nadie y no lanza.
  await prisma.user.updateMany({ where: { id: appUserId }, data });
}

export async function POST(req: NextRequest) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  if (req.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { event?: RCEvent } | null;
  const event = body?.event;
  if (!event) return NextResponse.json({ error: "bad-payload" }, { status: 400 });

  const appUserId = event.app_user_id;
  const until = typeof event.expiration_at_ms === "number" ? new Date(event.expiration_at_ms) : null;

  try {
    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "PRODUCT_CHANGE":
      case "NON_RENEWING_PURCHASE":
      case "TRANSFER":
        await grant(appUserId, { plus: true, plan: "native", plusUntil: until });
        break;
      case "EXPIRATION":
      case "SUBSCRIPTION_PAUSED":
        await grant(appUserId, { plus: false, plan: null, plusUntil: until });
        break;
      // CANCELLATION (auto-renovación desactivada, sigue con acceso hasta la expiración)
      // y BILLING_ISSUE (periodo de gracia) no cambian el derecho: se ignoran.
      default:
        break;
    }
  } catch (e) {
    console.error("revenuecat webhook", event.type, e);
    return NextResponse.json({ error: "handler" }, { status: 500 }); // RevenueCat reintenta
  }

  return NextResponse.json({ received: true });
}
