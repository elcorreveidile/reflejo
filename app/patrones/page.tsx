"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "../providers";
import { computeStreak, recentSeries, isoInDays } from "@/lib/store";
import type { AppData } from "@/lib/types";

const DIMS = [
  { key: "animo", name: "Ánimo", color: "#9aa6e0" },
  { key: "energia", name: "Energía", color: "#f0be86" },
  { key: "foco", name: "Foco", color: "#8fd0b8" },
] as const;

const HEAT = ["rgba(255,255,255,.06)", "#39406a", "#4a5896", "#6b7ec2", "#96a6e0", "#c3ccf5"];

function fmt1(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

function avg(xs: Array<number | undefined>): number | null {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function insights(data: AppData): string[] {
  const out: string[] = [];
  // Día de la semana con más escritura
  if (data.entries.length >= 3) {
    const byDow = new Array(7).fill(0);
    for (const e of data.entries) byDow[new Date(e.date + "T00:00:00").getDay()]++;
    const max = Math.max(...byDow);
    const dow = byDow.indexOf(max);
    const name = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(new Date(2026, 0, 4 + dow));
    out.push(`Escribes más los ${name}.`);
  }
  // Ánimo medio
  const animoAvg = avg(data.logs.map((l) => l.animo));
  if (animoAvg !== null) out.push(`Tu ánimo medio es ${fmt1(animoAvg)} sobre 5.`);
  // Decisiones revisadas
  const rev = data.decisions.filter((d) => d.outcome).length;
  if (rev > 0) out.push(`Has cerrado el círculo en ${rev} ${rev === 1 ? "decisión" : "decisiones"}.`);
  // Reencuadres
  if (data.practices.length > 0) out.push(`Llevas ${data.practices.length} ${data.practices.length === 1 ? "práctica completada" : "prácticas completadas"}.`);
  return out;
}

export default function PatronesPage() {
  const { data, plus } = useStore();
  const [summary, setSummary] = useState<string | null>(null);
  const [sumLoading, setSumLoading] = useState(false);
  const [sumNote, setSumNote] = useState("");

  const streak = computeStreak(data);
  const series = recentSeries(data, 14);
  const animoAvg = avg(data.logs.map((l) => l.animo));
  const revisadas = data.decisions.filter((d) => d.outcome).length;

  // Geometría del gráfico de líneas
  const W = 320, H = 150, PAD = 14;
  const x = (i: number) => PAD + (i / (series.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - ((v - 1) / 4) * (H - 2 * PAD);
  const lineFor = (key: "animo" | "energia" | "foco") =>
    series.map((pt, i) => ({ i, v: pt[key] })).filter((p): p is { i: number; v: number } => p.v !== null);

  // Mapa de ánimo (35 días)
  const heat = [];
  for (let i = 34; i >= 0; i--) {
    const date = isoInDays(-i);
    const v = avg(data.logs.filter((l) => l.date === date).map((l) => l.animo));
    heat.push({ date, level: v === null ? 0 : Math.max(1, Math.round(v)) });
  }

  // Actividad por área
  const acts = [
    { name: "Diario", n: data.entries.length, color: "#9aa6e0" },
    { name: "Estados", n: data.logs.length, color: "#8fd0b8" },
    { name: "Prácticas", n: data.practices.length, color: "#f0be86" },
    { name: "Decisiones", n: data.decisions.length, color: "#c6b9ea" },
  ];
  const actMax = Math.max(1, ...acts.map((a) => a.n));

  const list = insights(data);
  const hasData = data.entries.length + data.logs.length + data.practices.length + data.decisions.length > 0;

  async function generateSummary() {
    if (!plus) { setSumNote("El resumen con IA es parte de Reflejo Plus."); return; }
    setSumLoading(true);
    setSumNote("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "summary", context: { entries: data.entries.slice(-6).map((e) => e.text), moodAvg: animoAvg } }),
      });
      const j = await res.json();
      if (j.text) setSummary(j.text);
      else if (j.error === "no-ai") setSumNote("El asistente de IA aún no está configurado.");
      else if (j.error === "auth") setSumNote("Entra con tu cuenta para usar la IA.");
      else if (j.error === "plus") setSumNote("El resumen con IA es parte de Reflejo Plus.");
      else setSumNote("No se pudo generar ahora. Inténtalo de nuevo.");
    } catch {
      setSumNote("Sin conexión con la IA.");
    } finally {
      setSumLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#cfd2e4", fontSize: 14 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        Hoy
      </Link>

      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Patrones</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>Cómo te has movido</span>
      </header>

      {!hasData ? (
        <section className="glass" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="serif" style={{ fontSize: 19, color: "#fbfaff" }}>Aún no hay datos que mostrar.</span>
          <span style={{ fontSize: 14, color: "#cfd2e4", lineHeight: 1.5 }}>Escribe en el diario y registra tus estados unos días: aquí verás tus tendencias, tu mapa de ánimo y lo que Reflejo va notando.</span>
        </section>
      ) : (
        <>
          {/* Tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
            {[
              { label: "Entradas de diario", value: String(data.entries.length) },
              { label: "Ánimo medio", value: animoAvg === null ? "—" : `${fmt1(animoAvg)}/5` },
              { label: "Decisiones revisadas", value: `${revisadas} de ${data.decisions.length}` },
              { label: "Racha", value: `${streak} ${streak === 1 ? "día" : "días"}` },
            ].map((t) => (
              <div key={t.label} className="glass" style={{ borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: "#cfd2e4" }}>{t.label}</span>
                <span className="serif" style={{ fontSize: 28, fontWeight: 600, color: "#fbfaff" }}>{t.value}</span>
              </div>
            ))}
          </div>

          {/* Resumen con IA (Reflejo Plus) */}
          <section style={{ borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 12, background: "rgba(62,76,126,.28)", border: "1px solid rgba(154,166,224,.4)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Resumen con IA</span>
              <button onClick={generateSummary} disabled={sumLoading} style={{ background: "#9aa6e0", color: "#141628", border: "none", padding: "9px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, opacity: sumLoading ? 0.6 : 1 }}>
                {sumLoading ? "Pensando…" : plus ? "Generar" : "✨ Plus"}
              </button>
            </div>
            {summary ? (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#f5f3fb" }}>{summary}</p>
            ) : (
              <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>{sumNote || "Un vistazo honesto a tu diario y tus estados de los últimos días, escrito por la IA."}</span>
            )}
          </section>

          {/* Líneas */}
          <section className="glass" style={{ borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Ánimo, energía y foco</span>
              <div style={{ display: "flex", gap: 14 }}>
                {DIMS.map((d) => (
                  <span key={d.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cfd2e4" }}>
                    <span style={{ width: 12, height: 3, borderRadius: 2, background: d.color, display: "inline-block" }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 150 }}>
              {[1, 3, 5].map((v) => (
                <line key={v} x1={PAD} y1={y(v)} x2={W - PAD} y2={y(v)} stroke="rgba(255,255,255,.12)" strokeWidth={1} />
              ))}
              {DIMS.map((d) => {
                const pts = lineFor(d.key);
                if (pts.length === 0) return null;
                const poly = pts.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
                return (
                  <g key={d.key}>
                    {pts.length > 1 && <polyline points={poly} fill="none" stroke={d.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
                    {pts.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={2.6} fill={d.color} />)}
                  </g>
                );
              })}
            </svg>
            <span style={{ fontSize: 11, color: "#aeb1c6" }}>Últimos 14 días · escala 1–5</span>
          </section>

          {/* Mapa de ánimo */}
          <section className="glass" style={{ borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Mapa de ánimo</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#aeb1c6" }}>
                menos
                <span style={{ display: "flex", gap: 3 }}>
                  {HEAT.slice(1).map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 3, background: c, display: "inline-block" }} />)}
                </span>
                más
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {heat.map((c) => (
                <div key={c.date} title={c.date} style={{ aspectRatio: "1", borderRadius: 5, background: HEAT[c.level] }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "#aeb1c6" }}>Últimas 5 semanas · tu ánimo por día</span>
          </section>

          {/* Insights */}
          {list.length > 0 && (
            <section className="glass" style={{ borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Lo que Reflejo nota</span>
              {list.map((t) => (
                <div key={t} style={{ display: "flex", gap: 11 }}>
                  <span style={{ flexShrink: 0, color: "#8fd0b8", marginTop: 1 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.45, color: "#f5f3fb" }}>{t}</span>
                </div>
              ))}
            </section>
          )}

          {/* Actividad por área */}
          <section className="glass" style={{ borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Dónde pones la práctica</span>
            {acts.map((a) => (
              <div key={a.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#e7e7f0" }}>{a.name}</span>
                  <span style={{ color: "#aeb1c6" }}>{a.n}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
                  <div style={{ width: `${(a.n / actMax) * 100}%`, height: "100%", borderRadius: 999, background: a.color }} />
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
