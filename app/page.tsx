"use client";

import Link from "next/link";
import { useRef } from "react";
import { useStore } from "./providers";
import { BACKGROUNDS, backgroundThumb } from "@/lib/backgrounds";
import { computeStreak, todayISO } from "@/lib/store";
import { promptForToday } from "@/lib/prompts";
import { fileToScaledDataUrl } from "@/lib/image";
import type { BackgroundId } from "@/lib/types";

const MOODS = ["Bajo", "Flojo", "Normal", "Bien", "Pleno"];
const MOOD_NOTES = [
  "Un día cuesta arriba. Anótalo, no lo juzgues.",
  "Con poca energía. ¿Qué te la ha drenado?",
  "En equilibrio. Un buen sitio desde donde mirar.",
  "Buen momento. ¿Qué lo ha hecho posible?",
  "Pleno. Guarda este estado para recordarlo.",
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function longDate(): string {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" }).format(new Date());
}

export default function HoyPage() {
  const { data, setTodayMood, toggleHabit, setBackground } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const today = todayISO();
  const streak = computeStreak(data);
  const todayLog = [...data.logs].reverse().find((l) => l.date === today && typeof l.animo === "number");
  const mood = todayLog?.animo ?? null;
  const habitsToday = data.habits[today] ?? [false, false, false, false];

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToScaledDataUrl(file);
    setBackground("custom", url);
    e.target.value = "";
  }

  const options: BackgroundId[] = [...BACKGROUNDS.map((b) => b.id)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>
            {longDate()}
          </span>
          <span className="serif" style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>
            {greeting()},<br />
            {data.settings.name || "bienvenido"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Link href="/ajustes" aria-label="Ajustes" className="glass" style={{ width: 44, height: 44, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", color: "#e7e7f0" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
          </Link>
          <div className="glass" style={{ width: 60, height: 60, borderRadius: 999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: "#f3e2ce", lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 10, color: "#cfd2e4" }}>{streak === 1 ? "día" : "días"}</span>
          </div>
        </div>
      </header>

      {/* Selector de fondo */}
      <section className="glass" style={{ borderRadius: 18, padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Fondo · toca para cambiarlo</span>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          {options.map((id) => {
            const active = data.settings.background === id;
            return (
              <button
                key={id}
                onClick={() => setBackground(id)}
                aria-label={`Fondo ${id}`}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  boxShadow: active ? "0 0 0 2px #141628,0 0 0 4px #f0be86" : "0 0 0 1px rgba(255,255,255,.35)",
                  ...backgroundThumb(id),
                }}
              />
            );
          })}
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Subir tu propia foto"
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border: data.settings.background === "custom" ? "none" : "1px dashed rgba(255,255,255,.5)",
              boxShadow: data.settings.background === "custom" ? "0 0 0 2px #141628,0 0 0 4px #f0be86" : "none",
              background: "rgba(255,255,255,.06)",
              color: "#e7e7f0",
              fontSize: 22,
              ...(data.settings.background === "custom" ? backgroundThumb("custom", data.settings.customBg) : {}),
            }}
          >
            {data.settings.background === "custom" ? "" : "+"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />
        </div>
      </section>

      {/* Estado rápido */}
      <section className="glass" style={{ borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>¿Cómo te encuentras ahora?</span>
        <div style={{ display: "flex", gap: 7 }}>
          {MOODS.map((label, i) => {
            const on = mood === i + 1;
            return (
              <button
                key={label}
                onClick={() => setTodayMood(i + 1)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: on ? "1px solid #f0be86" : "1px solid rgba(255,255,255,.22)",
                  background: on ? "#f0be86" : "rgba(255,255,255,.06)",
                  color: on ? "#23233a" : "#d8daea",
                  fontSize: 12,
                  fontWeight: on ? 700 : 600,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {mood && <span style={{ fontSize: 13, lineHeight: 1.4, color: "#cfd2e4" }}>{MOOD_NOTES[mood - 1]}</span>}
      </section>

      {/* Reflexión */}
      <section style={{ borderRadius: 20, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14, background: "rgba(217,142,79,.24)", border: "1px solid rgba(240,190,140,.42)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
        <span style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#f1d6b8", fontWeight: 600 }}>Reflexión de hoy</span>
        <span className="serif" style={{ fontSize: 22, lineHeight: 1.25, fontWeight: 500, color: "#fbfaff" }}>{promptForToday()}</span>
        <Link href="/diario" style={{ alignSelf: "flex-start", background: "#f0be86", color: "#23233a", padding: "12px 18px", borderRadius: 999, fontSize: 14, fontWeight: 600 }}>
          Escribir en el diario
        </Link>
      </section>

      {/* Hábitos */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Hábitos de hoy</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.settings.habitLabels.map((label, i) => {
            if (!label.trim()) return null;
            const on = habitsToday[i];
            return (
              <button
                key={i}
                onClick={() => toggleHabit(i)}
                className="glass"
                style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 14, padding: "12px 14px", textAlign: "left", width: "100%" }}
              >
                <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: on ? "#5b8c82" : "rgba(255,255,255,.08)", border: on ? "none" : "1px solid rgba(255,255,255,.4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>
                  {on ? "✓" : ""}
                </span>
                <span style={{ fontSize: 14, color: on ? "#bfc2d6" : "#f5f3fb", textDecoration: on ? "line-through" : "none" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Link href="/patrones" className="glass" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tus patrones</span>
          <span style={{ fontSize: 12, lineHeight: 1.35, color: "#cfd2e4" }}>Tendencias, mapa de ánimo e insights</span>
        </div>
        <span style={{ color: "#f0be86", fontSize: 20 }}>{"→"}</span>
      </Link>

      <Link href="/conversar" className="glass" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Conversa con tu diario ✨</span>
          <span style={{ fontSize: 12, lineHeight: 1.35, color: "#cfd2e4" }}>Pregúntale a la IA sobre lo que escribiste</span>
        </div>
        <span style={{ color: "#9aa6e0", fontSize: 20 }}>{"→"}</span>
      </Link>
    </div>
  );
}
