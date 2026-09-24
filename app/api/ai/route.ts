import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { isPlus } from "@/lib/entitlement";
import { aiConfigured, askAI, askAIChat, type ChatMessage } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EntryCtx {
  date?: string;
  prompt?: string;
  text?: string;
  emotion?: string | null;
}

interface Context {
  entries?: Array<string | EntryCtx>;
  moodAvg?: number | null;
  energiaAvg?: number | null;
  focoAvg?: number | null;
  practices?: number;
  decisions?: number;
  streak?: number;
  period?: string;
}

interface Body {
  mode?: "prompt" | "summary" | "chat" | "monthly";
  context?: Context;
  messages?: ChatMessage[];
}

function fmtAvg(n: number | null | undefined): string {
  return typeof n === "number" ? `${n.toFixed(1)}/5` : "sin datos";
}

/** Renderiza el contexto del diario a texto para el modelo, sin inventar nada. */
function renderContext(ctx: Context | undefined, entryLimit: number, textLimit: number): string {
  const raw = ctx?.entries ?? [];
  const entries = raw.slice(-entryLimit).map((e) => {
    if (typeof e === "string") return `- ${String(e).slice(0, textLimit)}`;
    const parts: string[] = [];
    if (e.date) parts.push(`[${e.date}]`);
    if (e.emotion) parts.push(`(${e.emotion})`);
    const head = parts.join(" ");
    const body = String(e.text ?? "").slice(0, textLimit);
    return `- ${head ? head + " " : ""}${body}`;
  });
  const lines = [
    `Entradas del diario:\n${entries.length ? entries.join("\n") : "(todavía no hay entradas)"}`,
    `Ánimo medio: ${fmtAvg(ctx?.moodAvg)} · Energía media: ${fmtAvg(ctx?.energiaAvg)} · Foco medio: ${fmtAvg(ctx?.focoAvg)}.`,
  ];
  if (typeof ctx?.practices === "number") lines.push(`Prácticas completadas: ${ctx.practices}. Decisiones registradas: ${ctx?.decisions ?? 0}. Racha: ${ctx?.streak ?? 0} días.`);
  return lines.join("\n\n");
}

export async function POST(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!(await isPlus(session))) return NextResponse.json({ error: "plus" }, { status: 403 });
  if (!aiConfigured()) return NextResponse.json({ error: "no-ai" });

  const body = (await req.json().catch(() => ({}))) as Body;

  // --- Conversa con tu diario ---
  if (body.mode === "chat") {
    const history = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) }));
    if (history.length === 0 || history[history.length - 1].role !== "user") {
      return NextResponse.json({ error: "empty" });
    }
    const contexto = renderContext(body.context, 25, 700);
    const system =
      "Eres el confidente sereno de la persona que escribe este diario. Respondes SOLO a partir de lo que hay en su diario y sus estados; si algo no está, dilo con honestidad en vez de inventarlo. Hablas en español, en segunda persona, cálido y directo, sin condescendencia ni diagnósticos clínicos. Ayudas a ver patrones, hacer buenas preguntas y decidir; no das consejos médicos. Respuestas breves (2-5 frases), sin listas ni encabezados salvo que te lo pidan.\n\n" +
      "=== CONTEXTO DEL DIARIO (privado) ===\n" +
      contexto;
    const text = await askAIChat(system, history, 500);
    return NextResponse.json(text ? { text } : { error: "empty" });
  }

  // --- Informe mensual ---
  if (body.mode === "monthly") {
    const contexto = renderContext(body.context, 40, 500);
    const periodo = body.context?.period ?? "el último mes";
    const system =
      "Eres un guía de introspección honesto y cálido. Escribes en español un breve informe mensual del diario de la persona, basándote SOLO en los datos aportados, sin inventar. Estructura en tres párrafos cortos con estos encabezados en negrita markdown: **Lo que veo** (patrones y emociones dominantes), **Lo que has movido** (prácticas, decisiones, constancia) y **Para el mes que viene** (una o dos sugerencias concretas y amables). Nada de juicios ni lenguaje clínico.";
    const text = await askAI(system, `Informe de ${periodo}.\n\n${contexto}`, 700);
    return NextResponse.json(text ? { text } : { error: "empty" });
  }

  const entries = (body.context?.entries ?? []).slice(-6).map((e) => (typeof e === "string" ? e : String(e.text ?? "")).slice(0, 600));
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
