import { prisma } from "./db";
import type { SessionPayload } from "./session";

export interface Entitlement {
  plus: boolean;
  plan: string | null; // "sub" | "lifetime" | "cortesía" | null
  plusUntil: string | null; // ISO
}

function allowList(): string[] {
  return (process.env.PREMIUM_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Reflejo Plus. Se concede por compra en Stripe (User.plus, que mantiene el webhook)
// o por lista de emails de cortesía (regalos / pruebas sin cobro).
export async function getEntitlement(session: SessionPayload | null): Promise<Entitlement> {
  if (!session) return { plus: false, plan: null, plusUntil: null };
  const courtesy = allowList().includes(session.email.toLowerCase());
  let u: { plus: boolean; plan: string | null; plusUntil: Date | null } | null = null;
  try {
    u = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { plus: true, plan: true, plusUntil: true },
    });
  } catch {
    u = null;
  }
  const plus = courtesy || !!u?.plus;
  const plan = u?.plan ?? (courtesy ? "cortesía" : null);
  return { plus, plan, plusUntil: u?.plusUntil ? u.plusUntil.toISOString() : null };
}

export async function isPlus(session: SessionPayload | null): Promise<boolean> {
  return (await getEntitlement(session)).plus;
}
