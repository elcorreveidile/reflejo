import { prisma } from "./db";
import type { SessionPayload } from "./session";

// Reflejo Plus. Hoy se concede por lista de emails (para pruebas sin cobro) o por
// el campo User.plus (que activará el cobro cuando lo conectemos con Stripe/RevenueCat).
export async function isPlus(session: SessionPayload | null): Promise<boolean> {
  if (!session) return false;
  const allow = (process.env.PREMIUM_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.includes(session.email.toLowerCase())) return true;
  try {
    const u = await prisma.user.findUnique({ where: { id: session.uid }, select: { plus: true } });
    return !!u?.plus;
  } catch {
    return false;
  }
}
