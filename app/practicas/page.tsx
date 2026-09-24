"use client";

import { useState } from "react";
import { useStore } from "../providers";
import { CAPACITIES, EXERCISES, exercisesFor, capacityMeta, type Exercise } from "@/lib/practices";
import { sortByNewest, todayISO } from "@/lib/store";
import type { Capacity } from "@/lib/types";

const CAP_ICON: Record<Capacity, React.ReactNode> = {
  critico: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.4-3.4" /></>),
  creatividad: (<><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" /></>),
  liderazgo: (<><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.5-5.5 5.5-5.5" /><circle cx="17" cy="10" r="2.5" /><path d="M14.5 19c0-2.4 1.7-4.3 4-4.3 1 0 1.9.3 2.5.9" /></>),
  autoconocimiento: (<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></>),
};

const primaryBtn = { background: "#f0be86", color: "#23233a", border: "none", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 } as const;
const ghostBtn = { background: "rgba(255,255,255,.10)", color: "#d8daea", border: "1px solid rgba(255,255,255,.22)", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600 } as const;
const area = { width: "100%", boxSizing: "border-box", minHeight: 110, resize: "none", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 14, padding: 13, fontSize: 14, lineHeight: 1.5, color: "#fbfaff", whiteSpace: "pre-wrap" } as const;

function Icon({ cap, size = 22 }: { cap: Capacity; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{CAP_ICON[cap]}</svg>
  );
}

export default function PracticasPage() {
  const { data, addPractice, plus } = useStore();
  const [cap, setCap] = useState<Capacity | null>(null);
  const [exId, setExId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [upsell, setUpsell] = useState(false);

  const ex = EXERCISES.find((e) => e.id === exId) ?? null;
  const todayCount = data.practices.filter((p) => p.date === todayISO()).length;
  const recent = sortByNewest(data.practices).slice(0, 3);

  function start(e: Exercise) {
    if (e.plus && !plus) { setUpsell(true); return; }
    setExId(e.id);
    setStep(0);
    setAnswers({});
    setDone(false);
  }

  function save(e: Exercise) {
    addPractice({ exercise: e.id, capacity: e.capacity, title: e.title, fields: answers });
    setDone(true);
  }

  const kicker = { fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 } as const;
  const back = (onClick: () => void, label: string) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, color: "#cfd2e4", fontSize: 14, background: "none", border: "none" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      {label}
    </button>
  );

  // --- Vista: ejercicio en marcha ---
  if (ex && !done) {
    const s = ex.steps[step];
    const value = answers[s.key] ?? "";
    const canNext = value.trim().length > 0;
    const last = step === ex.steps.length - 1;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {back(() => setExId(null), capacityMeta(ex.capacity).name)}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{ex.title}</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {ex.steps.map((_, i) => (
              <span key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 999, background: i === step ? "#f0be86" : "rgba(255,255,255,.3)", display: "inline-block" }} />
            ))}
          </div>
        </div>
        <span className="serif" style={{ fontSize: 21, lineHeight: 1.28, color: "#fbfaff" }}>{s.prompt}</span>

        {s.kind === "choice" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(s.choices ?? []).map((c) => {
              const on = value === c;
              return (
                <button key={c} onClick={() => setAnswers((a) => ({ ...a, [s.key]: c }))} style={{ textAlign: "left", background: on ? "#f0be86" : "rgba(255,255,255,.08)", color: on ? "#23233a" : "#e7e7f0", border: on ? "1px solid #f0be86" : "1px solid rgba(255,255,255,.22)", padding: "12px 14px", borderRadius: 12, fontSize: 13, fontWeight: on ? 700 : 500 }}>{c}</button>
              );
            })}
          </div>
        ) : (
          <textarea value={value} onChange={(e2) => setAnswers((a) => ({ ...a, [s.key]: e2.target.value }))} placeholder={s.placeholder} style={area} />
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 && <button onClick={() => setStep((n) => n - 1)} style={ghostBtn}>Atrás</button>}
          {last ? (
            <button onClick={() => save(ex)} disabled={!canNext} style={{ ...primaryBtn, flex: 1, background: "#8fd0b8", color: "#14352a", opacity: canNext ? 1 : 0.5 }}>Guardar</button>
          ) : (
            <button onClick={() => setStep((n) => n + 1)} disabled={!canNext} style={{ ...primaryBtn, flex: 1, opacity: canNext ? 1 : 0.5 }}>Siguiente</button>
          )}
        </div>
      </div>
    );
  }

  // --- Vista: guardado ---
  if (ex && done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={kicker}>{capacityMeta(ex.capacity).name}</span>
        <span className="serif" style={{ fontSize: 24, lineHeight: 1.2, color: "#fbfaff" }}>Guardado. Una práctica más.</span>
        <span style={{ fontSize: 14, color: "#cfd2e4", lineHeight: 1.5 }}>Vuelve cuando quieras; cada práctica cuenta para tu racha y tus patrones.</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setExId(null); setDone(false); }} style={{ ...ghostBtn, flex: 1 }}>Otro ejercicio</button>
          <button onClick={() => { setCap(null); setExId(null); setDone(false); }} style={{ ...primaryBtn, flex: 1 }}>Prácticas</button>
        </div>
      </div>
    );
  }

  // --- Vista: ejercicios de una capacidad ---
  if (cap) {
    const meta = capacityMeta(cap);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {back(() => { setCap(null); setUpsell(false); }, "Prácticas")}
        <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ ...kicker, color: meta.color }}>{meta.name}</span>
          <span className="serif" style={{ fontSize: 26, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>{meta.desc}</span>
        </header>

        {upsell && (
          <section style={{ borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 6, background: "rgba(62,76,126,.28)", border: "1px solid rgba(154,166,224,.4)" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>✨ Reflejo Plus</span>
            <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>Estos ejercicios forman parte de Reflejo Plus. Pensamiento crítico es gratis para empezar.</span>
          </section>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exercisesFor(cap).map((e) => {
            const locked = e.plus && !plus;
            return (
              <button key={e.id} onClick={() => start(e)} className="glass" style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, padding: "14px 16px", textAlign: "left", width: "100%" }}>
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fbfaff" }}>{e.title}</span>
                  <span style={{ fontSize: 12, color: "#cfd2e4", lineHeight: 1.35 }}>{e.intro}</span>
                </div>
                {locked ? (
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#c7cde4", background: "rgba(154,166,224,.22)", borderRadius: 999, padding: "4px 10px" }}>Plus</span>
                ) : (
                  <span style={{ flexShrink: 0, color: meta.color, fontSize: 18 }}>{"→"}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Vista raíz: capacidades ---
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={kicker}>Prácticas</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>Entrena tu forma de pensar</span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
        {CAPACITIES.map((c) => {
          const n = exercisesFor(c.key).length;
          return (
            <button key={c.key} onClick={() => { setCap(c.key); setUpsell(false); }} className="glass" style={{ borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
              <span style={{ color: c.color }}><Icon cap={c.key} /></span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fbfaff" }}>{c.name}</span>
              <span style={{ fontSize: 12, lineHeight: 1.35, color: "#cfd2e4" }}>{c.desc}</span>
              <span style={{ fontSize: 11, color: "#9aa0b6", marginTop: 2 }}>{n} {n === 1 ? "ejercicio" : "ejercicios"}</span>
            </button>
          );
        })}
      </div>

      {todayCount > 0 && (
        <span style={{ fontSize: 13, color: "#cfd2e4" }}>Hoy has completado {todayCount} {todayCount === 1 ? "práctica" : "prácticas"}.</span>
      )}

      {recent.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Prácticas recientes</span>
          {recent.map((p) => {
            const m = capacityMeta(p.capacity);
            const firstField = Object.values(p.fields ?? {})[0] ?? "";
            return (
              <article key={p.id} className="glass" style={{ borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fbfaff" }}>{p.title}</span>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: m.color }}>{m.name}</span>
                </div>
                {firstField && <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{firstField}</span>}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
