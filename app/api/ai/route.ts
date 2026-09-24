import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { isPlus } from "@/lib/entitlement";
import { aiConfigured, askAI } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  mode?: "prompt" | "summary";
  context?: { entries?: string[]; moodAvg?: number | null; days?: number };
}

export async function POST(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!(await isPlus(session))) return NextResponse.json({ error: "plus" }, { status: 403 });
  if (!aiConfigured()) return NextResponse.json({ error: "no-ai" });

  const body = (await req.json().catch(() => ({}))) as Body;
  const entries = (body.context?.entries ?? []).slice(-6).map((t) => String(t).slice(0, 600));
  const moodAvg = body.context?.moodAvg ?? null;
  const contexto = `Entradas recientes del diario:\n${entries.length ? entries.join("\n---\n") : "(todavía no hay entradas)"}\n\nÁnimo medio reciente: ${moodAvg === null ? "sin datos" : `${moodAvg.toFixed(1)}/5`}.`;

  if (body.mode === "summary") {
    const system = "Eres un guía de introspección sereno y honesto. Resume en 3-4 frases cálidas, en español, lo que observas en el diario y los estados recientes de la persona, sin juzgar y sin inventar datos. Termina con una sola sugerencia amable. No uses listas ni encabezados.";
    const text = await askAI(system, contexto, 380);
    return NextResponse.json(text ? { text } : { error: "empty" });
  }

  // mode === "prompt" (por defecto)
  const system = "Eres un guía de introspección. Devuelve UNA sola pregunta breve (máximo 20 palabras), en español, personal, abierta y no genérica, para que la persona escriba hoy en su diario, inspirada en su contexto reciente. Responde solo con la pregunta, sin comillas ni preámbulos.";
  const text = await askAI(system, `${contexto}\n\nEscribe una pregunta nueva y distinta a lo ya escrito.`, 80);
  return NextResponse.json(text ? { text: text.replace(/^["'\s]+|["'\s]+$/g, "") } : { error: "empty" });
}
