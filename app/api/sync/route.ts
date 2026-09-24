import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { normalize, DEFAULT_DATA } from "@/lib/store";
import { mergeAppData } from "@/lib/merge";
import type { AppData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userId(req: NextRequest): string | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value)?.uid ?? null;
}

export async function GET(req: NextRequest) {
  const id = userId(req);
  if (!id) return NextResponse.json({ error: "auth" }, { status: 401 });
  const row = await prisma.syncState.findUnique({ where: { userId: id } });
  const data = row ? normalize(row.data as Partial<AppData>) : DEFAULT_DATA;
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const id = userId(req);
  if (!id) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const incoming = normalize((body?.data ?? {}) as Partial<AppData>);
  const row = await prisma.syncState.findUnique({ where: { userId: id } });
  const stored = row ? normalize(row.data as Partial<AppData>) : DEFAULT_DATA;
  const merged = mergeAppData(stored, incoming);
  const json = merged as unknown as Prisma.InputJsonValue;
  await prisma.syncState.upsert({
    where: { userId: id },
    update: { data: json },
    create: { userId: id, data: json },
  });
  return NextResponse.json({ data: merged });
}
