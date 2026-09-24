"use client";

import { useState } from "react";
import { useStore } from "../providers";
import { LENSES } from "@/lib/types";
import { sortByNewest, todayISO } from "@/lib/store";

const CAPS = [
  { name: "Pensamiento crítico", desc: "Cuestiona lo que das por hecho", color: "#9aa6e0", active: true,
    icon: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.4-3.4" /></>) },
  { name: "Creatividad", desc: "Genera ideas sin filtro", color: "#f0be86", active: false,
    icon: (<><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" /></>) },
  { name: "Liderazgo", desc: "Influye en otros para bien", color: "#8fd0b8", active: false,
    icon: (<><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.5-5.5 5.5-5.5" /><circle cx="17" cy="10" r="2.5" /><path d="M14.5 19c0-2.4 1.7-4.3 4-4.3 1 0 1.9.3 2.5.9" /></>) },
  { name: "Autoconocimiento", desc: "Observa cómo piensas", color: "#c6b9ea", active: false,
    icon: (<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></>) },
];

export default function PracticasPage() {
  const { data, addPractice } = useStore();
  const [step, setStep] = useState(1);
  const [thought, setThought] = useState("");
  const [lens, setLens] = useState(0);
  const [reframe, setReframe] = useState("");
  const [done, setDone] = useState(false);

  const todayCount = data.practices.filter((p) => p.date === todayISO()).length;
  const recent = sortByNewest(data.practices).slice(0, 3);

  function save() {
    addPractice({ type: "reframe", thought: thought.trim(), lens: LENSES[lens], reframe: reframe.trim() });
    setDone(true);
  }
  function restart() {
    setStep(1);
    setThought("");
    setLens(0);
    setReframe("");
    setDone(false);
  }

  const btnPrimary = { background: "#f0be86", color: "#23233a", border: "none", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 } as const;
  const btnGhost = { background: "rgba(255,255,255,.10)", color: "#d8daea", border: "1px solid rgba(255,255,255,.22)", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600 } as const;
  const area = { width: "100%", boxSizing: "border-box", minHeight: 96, resize: "none", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 14, padding: 13, fontSize: 14, lineHeight: 1.5, color: "#fbfaff" } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Prácticas</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>Entrena tu forma de pensar</span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
        {CAPS.map((c) => (
          <div key={c.name} className="glass" style={{ borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 8, opacity: c.active ? 1 : 0.62 }}>
            <span style={{ color: c.color }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg>
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
            <span style={{ fontSize: 12, lineHeight: 1.35, color: "#cfd2e4" }}>{c.active ? c.desc : "Pronto"}</span>
          </div>
        ))}
      </div>

      {/* Ejercicio del día */}
      <section style={{ borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 16, background: "rgba(217,142,79,.22)", border: "1px solid rgba(240,190,140,.4)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "#f1d6b8", fontWeight: 700 }}>Reto de hoy</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Cuestiona un pensamiento</span>
          </div>
          {!done && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3].map((i) => (
                <span key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 999, background: i === step ? "#f0be86" : "rgba(255,255,255,.3)", display: "inline-block" }} />
              ))}
            </div>
          )}
        </div>

        {done ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="serif" style={{ fontSize: 19, lineHeight: 1.3, color: "#fbfaff" }}>Guardado. Un pensamiento menos en piloto automático.</span>
            <button onClick={restart} style={btnPrimary}>Hacer otro</button>
          </div>
        ) : step === 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="serif" style={{ fontSize: 19, lineHeight: 1.25, color: "#fbfaff" }}>Escribe algo que estás dando por cierto ahora mismo.</span>
            <textarea value={thought} onChange={(e) => setThought(e.target.value)} placeholder="Ej.: si subo los precios, perderé a la mitad de mis clientes." style={area} />
            <button onClick={() => setStep(2)} disabled={!thought.trim()} style={{ ...btnPrimary, opacity: thought.trim() ? 1 : 0.5 }}>Siguiente</button>
          </div>
        ) : step === 2 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="serif" style={{ fontSize: 19, lineHeight: 1.25, color: "#fbfaff" }}>¿Qué le falta para sostenerse?</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LENSES.map((l, i) => {
                const on = lens === i;
                return (
                  <button key={l} onClick={() => setLens(i)} style={{ textAlign: "left", background: on ? "#f0be86" : "rgba(255,255,255,.08)", color: on ? "#23233a" : "#e7e7f0", border: on ? "1px solid #f0be86" : "1px solid rgba(255,255,255,.22)", padding: "12px 14px", borderRadius: 12, fontSize: 13, fontWeight: on ? 700 : 500 }}>
                    {l}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(1)} style={btnGhost}>Atrás</button>
              <button onClick={() => setStep(3)} style={{ ...btnPrimary, flex: 1 }}>Siguiente</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#cfd2e4" }}>Lente · <b style={{ color: "#f0be86" }}>{LENSES[lens]}</b></span>
            <span className="serif" style={{ fontSize: 19, lineHeight: 1.25, color: "#fbfaff" }}>Reescríbelo con más matices.</span>
            <textarea value={reframe} onChange={(e) => setReframe(e.target.value)} placeholder="Reescribe el pensamiento de forma más justa y comprobable." style={area} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(2)} style={btnGhost}>Atrás</button>
              <button onClick={save} disabled={!reframe.trim()} style={{ background: "#8fd0b8", color: "#14352a", border: "none", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600, flex: 1, opacity: reframe.trim() ? 1 : 0.5 }}>Guardar reflexión</button>
            </div>
          </div>
        )}
      </section>

      {todayCount > 0 && (
        <span style={{ fontSize: 13, color: "#cfd2e4" }}>Hoy has completado {todayCount} {todayCount === 1 ? "práctica" : "prácticas"}.</span>
      )}

      {recent.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Reencuadres recientes</span>
          {recent.map((p) => (
            <article key={p.id} className="glass" style={{ borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#cfd2e4", textDecoration: "line-through" }}>{p.thought}</span>
              <span style={{ fontSize: 14, color: "#f5f3fb", lineHeight: 1.45 }}>{p.reframe}</span>
              <span style={{ fontSize: 11, color: "#f1d6a8", fontWeight: 700 }}>{p.lens}</span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
