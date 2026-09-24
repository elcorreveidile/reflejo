import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { billingBaseUrl } from "@/lib/billing";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "no-stripe" }, { status: 503 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) return NextResponse.json({ error: "no-customer" }, { status: 400 });

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${billingBaseUrl(req)}/plus`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("portal", e);
    return NextResponse.json({ error: "stripe" }, { status: 500 });
  }
}
