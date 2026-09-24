import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  const fail = () => NextResponse.redirect(new URL("/ajustes?error=token", req.url));
  if (!token) return fail();
  try {
    const vt = await prisma.verificationToken.findUnique({ where: { token }, include: { user: true } });
    if (!vt || vt.expiresAt < new Date()) return fail();
    await prisma.verificationToken.delete({ where: { id: vt.id } }).catch(() => {});
    const jwt = signSession({ uid: vt.userId, email: vt.user.email, exp: Date.now() + SESSION_MAX_AGE * 1000 });
    const res = NextResponse.redirect(new URL("/ajustes?synced=1", req.url));
    res.cookies.set(SESSION_COOKIE, jwt, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
    return res;
  } catch (err) {
    console.error("[reflejo] auth/verify", err);
    return fail();
  }
}
