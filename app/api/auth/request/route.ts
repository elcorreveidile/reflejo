import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendMagicLink } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }
  try {
    const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });
    const base = process.env.APP_URL || new URL(req.url).origin;
    const link = `${base}/api/auth/verify?token=${token}`;
    const result = await sendMagicLink(email, link);
    return NextResponse.json({ ok: true, ...(result.sent ? {} : { devLink: result.devLink }) });
  } catch (err) {
    console.error("[reflejo] auth/request", err);
    return NextResponse.json({ error: "No se pudo enviar el enlace" }, { status: 500 });
  }
}
