"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useStore } from "../providers";
import { buildAiContext } from "@/lib/aiContext";
import type { ChatMessage } from "@/lib/ai";

const STARTERS = [
  "¿Qué patrón ves en lo que he escrito últimamente?",
  "¿De qué me estoy quejando sin darme cuenta?",
  "¿Qué me da energía y qué me la quita, según mi diario?",
  "Ayúdame a entender qué siento con la decisión que tengo pendiente.",
];

export default function ConversarPage() {
  const { data, plus, email } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    if (!plus) { setNote("Conversar con tu diario es parte de Reflejo Plus."); return; }
    setNote("");
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const ctx = buildAiContext(data, { maxEntries: 25 });
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "chat", messages: next, context: ctx }),
      });
      const j = await res.json();
      if (j.text) setMessages((m) => [...m, { role: "assistant", content: j.text }]);
      else if (j.error === "no-ai") setNote("El asistente de IA aún no está configurado.");
      else if (j.error === "auth") setNote("Entra con tu cuenta para conversar.");
      else if (j.error === "plus") setNote("Conversar con tu diario es parte de Reflejo Plus.");
      else setNote("No se pudo responder ahora. Inténtalo de nuevo.");
    } catch {
      setNote("Sin conexión con la IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "78vh" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#cfd2e4", fontSize: 14 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        Hoy
      </Link>

      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Conversa con tu diario</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.12, fontWeight: 500, color: "#fbfaff" }}>Pregúntale a lo que escribiste</span>
      </header>

      {!plus && (
        <section style={{ borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 10, background: "rgba(62,76,126,.28)", border: "1px solid rgba(154,166,224,.4)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fbfaff" }}>✨ Reflejo Plus</span>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "#e7e7f0" }}>
            Conversa con tu propio diario: la IA responde a partir de lo que has escrito y de tus estados, para ayudarte a ver patrones y decidir. {email ? "Tu cuenta aún no tiene Plus." : "Necesitas una cuenta para activarlo."}
          </span>
          <Link href={email ? "/plus" : "/ajustes"} style={{ alignSelf: "flex-start", background: "#9aa6e0", color: "#141628", padding: "10px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
            {email ? "Ver Reflejo Plus" : "Entrar / Ajustes"}
          </Link>
        </section>
      )}

      <div ref={scrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", paddingBottom: 4 }}>
        {messages.length === 0 && (
          <section className="glass" style={{ borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.5 }}>
              Nadie más lee esto. La conversación no se guarda: vive solo en esta pantalla. Prueba con:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading} style={{ textAlign: "left", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 12, padding: "11px 13px", color: "#f5f3fb", fontSize: 13.5, lineHeight: 1.4 }}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              className={m.role === "assistant" ? "glass" : undefined}
              style={{
                maxWidth: "85%",
                borderRadius: 16,
                padding: "12px 14px",
                fontSize: 14.5,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                ...(m.role === "user"
                  ? { background: "#f0be86", color: "#23233a", borderBottomRightRadius: 5, fontWeight: 500 }
                  : { color: "#f5f3fb", borderBottomLeftRadius: 5 }),
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div className="glass" style={{ borderRadius: 16, borderBottomLeftRadius: 5, padding: "12px 16px", fontSize: 14, color: "#cfd2e4" }}>Pensando…</div>
          </div>
        )}
      </div>

      {note && <span style={{ fontSize: 12.5, color: "#f1d6a8", lineHeight: 1.4 }}>{note}</span>}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", position: "sticky", bottom: 0 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder={plus ? "Escribe tu pregunta…" : "Disponible con Reflejo Plus"}
          rows={1}
          disabled={!plus}
          style={{ flex: 1, resize: "none", maxHeight: 120, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 16, padding: "13px 15px", fontSize: 14.5, lineHeight: 1.5, color: "#fbfaff", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading || !plus}
          aria-label="Enviar"
          style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 999, border: "none", background: input.trim() && plus ? "#f0be86" : "rgba(255,255,255,.12)", color: input.trim() && plus ? "#23233a" : "#8a8ca0", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </div>
    </div>
  );
}
