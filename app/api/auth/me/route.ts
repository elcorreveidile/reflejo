import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { getEntitlement } from "@/lib/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ email: null, plus: false, plan: null, plusUntil: null });
  const ent = await getEntitlement(session);
  return NextResponse.json({ email: session.email, ...ent });
}
