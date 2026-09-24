"use client";

import { useState } from "react";
import { useStore } from "../providers";
import { promptForToday, EMOTIONS } from "@/lib/prompts";
import { sortByNewest } from "@/lib/store";

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(iso + "T00:00:00"));
}

export default function DiarioPage() {
  const { data, addEntry, plus } = useStore();
  const [offset, setOffset] = useState(0);
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState("");

  const prompt = aiPrompt ?? promptForToday(offset);

  async function generateAi() {
    if (!plus) { setAiNote("La pregunta con IA es parte de Reflejo Plus."); return; }
    setAiLoading(true);
    setAiNote("");
    const moodVals = data.logs.map((l) => l.animo).filter((x): x is number => typeof x === "number");
    const moodAvg = moodVals.length ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length : null;
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "prompt", context: { entries: data.entries.slice(-6).map((e) => e.text), moodAvg } }),
      });
      const j = await res.json();
      if (j.text) setAiPrompt(j.text);
      else if (j.error === "no-ai") setAiNote("El asistente de IA aún no está configurado.");
      else if (j.error === "auth") setAiNote("Entra con tu cuenta para usar la IA.");
      else if (j.error === "plus") setAiNote("La pregunta con IA es parte de Reflejo Plus.");
      else setAiNote("No se pudo generar ahora. Inténtalo de nuevo.");
    } catch {
      setAiNote("Sin conexión con la IA.");
    } finally {
      setAiLoading(false);
    }
  }
  const recent = sortByNewest(data.entries).slice(0, 5);

  function onSave() {
    if (!text.trim()) return;
    addEntry(prompt, text, emotion);
    setText("");
    setEmotion(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Diario</span>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={generateAi} disabled={aiLoading} style={{ background: "none", border: "none", color: plus ? "#f0be86" : "#8f93ad", fontSize: 13, fontWeight: 600 }}>
            {aiLoading ? "Pensando…" : "✨ IA"}
          </button>
          <button onClick={() => { setAiPrompt(null); setAiNote(""); setOffset((o) => o + 1); }} style={{ background: "none", border: "none", color: "#f0be86", fontSize: 13, fontWeight: 600 }}>
            Otra pregunta
          </button>
        </div>
      </header>

      <span className="serif" style={{ fontSize: 25, lineHeight: 1.22, fontWeight: 500, color: "#fbfaff" }}>{prompt}</span>
      {aiNote && <span style={{ fontSize: 12, color: "#f1d6a8", lineHeight: 1.4, marginTop: -8 }}>{aiNote}</span>}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe con calma. Nadie más lo lee."
        style={{ width: "100%", minHeight: 210, resize: "none", background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.20)", borderRadius: 16, padding: 16, fontSize: 15, lineHeight: 1.55, color: "#fbfaff", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>¿Con qué emoción lo asocias?</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EMOTIONS.map((label) => {
            const on = emotion === label;
            return (
              <button
                key={label}
                onClick={() => setEmotion(on ? null : label)}
                style={{ padding: "9px 14px", borderRadius: 999, border: on ? "1px solid #f0be86" : "1px solid rgba(255,255,255,.22)", background: on ? "#f0be86" : "rgba(255,255,255,.07)", color: on ? "#23233a" : "#d8daea", fontSize: 13, fontWeight: on ? 700 : 600 }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#aeb1c6" }}>{saved ? "Guardado ✓" : "Privado, solo en tu dispositivo"}</span>
        <button onClick={onSave} disabled={!text.trim()} style={{ background: text.trim() ? "#f0be86" : "rgba(255,255,255,.12)", color: text.trim() ? "#23233a" : "#8a8ca0", border: "none", padding: "13px 22px", borderRadius: 999, fontSize: 14, fontWeight: 600 }}>
          Guardar entrada
        </button>
      </div>

      {recent.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Entradas recientes</span>
          {recent.map((e) => (
            <article key={e.id} className="glass" style={{ borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#aeb1c6" }}>{shortDate(e.date)}</span>
                {e.emotion && <span style={{ fontSize: 11, fontWeight: 700, color: "#f1d6a8", background: "rgba(217,142,79,.26)", borderRadius: 999, padding: "3px 9px" }}>{e.emotion}</span>}
              </div>
              <span style={{ fontSize: 12, color: "#cfd2e4" }}>{e.prompt}</span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#f5f3fb", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.text}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
