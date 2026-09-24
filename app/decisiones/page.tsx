"use client";

import { useState } from "react";
import { useStore } from "../providers";
import { OUTCOMES, PLAZOS, type Decision } from "@/lib/types";
import { sortByNewest, daysSince } from "@/lib/store";
import { computeCalibration } from "@/lib/calibration";

function outcomeBadge(outcome: string): { color: string; bg: string } {
  if (outcome === "Mejor") return { color: "#bbe6cd", bg: "rgba(91,140,130,.32)" };
  if (outcome === "Peor") return { color: "#f1d6a8", bg: "rgba(217,142,79,.3)" };
  return { color: "#d8daea", bg: "rgba(255,255,255,.14)" };
}

function ReviewCard({ decision }: { decision: Decision }) {
  const { reviewDecision } = useStore();
  const [outcome, setOutcome] = useState<string | null>(null);
  const [learning, setLearning] = useState("");
  const dias = daysSince(decision.date);

  return (
    <div style={{ background: "rgba(217,142,79,.2)", border: "1px solid rgba(240,190,140,.4)", borderTop: "3px solid #f0be86", borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14, WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
      <span style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "#f1d6b8", fontWeight: 700 }}>
        Hace {dias} {dias === 1 ? "día" : "días"} · toca revisar
      </span>
      <span className="serif" style={{ fontSize: 20, lineHeight: 1.28, color: "#fbfaff" }}>{decision.title}</span>
      {decision.premortem && <span style={{ fontSize: 12, color: "#cfd2e4", lineHeight: 1.4, fontStyle: "italic" }}>Tu premortem: {decision.premortem}</span>}
      <span style={{ fontSize: 13, color: "#cfd2e4" }}>¿Cómo ha salido, con perspectiva?</span>
      <div style={{ display: "flex", gap: 8 }}>
        {OUTCOMES.map((o) => {
          const on = outcome === o;
          return (
            <button key={o} onClick={() => setOutcome(o)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: on ? "1px solid #f0be86" : "1px solid rgba(255,255,255,.22)", background: on ? "#f0be86" : "rgba(255,255,255,.08)", color: on ? "#23233a" : "#e7e7f0", fontSize: 12, fontWeight: on ? 700 : 600 }}>
              {o}
            </button>
          );
        })}
      </div>
      {outcome && (
        <>
          <textarea value={learning} onChange={(e) => setLearning(e.target.value)} placeholder="¿Qué aprendes para la próxima decisión parecida?" style={{ width: "100%", boxSizing: "border-box", minHeight: 70, resize: "none", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5, color: "#fbfaff" }} />
          <button onClick={() => reviewDecision(decision.id, outcome, learning)} style={{ background: "#8fd0b8", color: "#14352a", border: "none", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
            Guardar revisión
          </button>
        </>
      )}
    </div>
  );
}

export default function DecisionesPage() {
  const { data, addDecision, plus } = useStore();
  const [title, setTitle] = useState("");
  const [conf, setConf] = useState(3);
  const [plazo, setPlazo] = useState(1);
  const [premortem, setPremortem] = useState("");
  const [preUpsell, setPreUpsell] = useState(false);
  const [saved, setSaved] = useState(false);
  const cal = computeCalibration(data.decisions);

  const pendientes = data.decisions.filter((d) => !d.outcome);
  const due = pendientes.filter((d) => d.reviewAt <= new Date().toISOString().slice(0, 10)).sort((a, b) => a.reviewAt.localeCompare(b.reviewAt));
  const futuras = pendientes.filter((d) => !due.includes(d));
  const historial = sortByNewest(data.decisions.filter((d) => d.outcome));

  function save() {
    if (!title.trim()) return;
    addDecision({ title, confidence: conf, reviewInDays: PLAZOS[plazo].days, premortem: plus && premortem.trim() ? premortem.trim() : undefined });
    setTitle("");
    setConf(3);
    setPlazo(1);
    setPremortem("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Decisiones</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>Decide y hazte cargo</span>
      </header>

      {due.map((d) => <ReviewCard key={d.id} decision={d} />)}

      {/* Calibración (Reflejo Plus) */}
      <section style={{ borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14, background: "rgba(62,76,126,.28)", border: "1px solid rgba(154,166,224,.4)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Calibración</span>
          {!plus && <span style={{ fontSize: 11, fontWeight: 700, color: "#c7cde4", background: "rgba(154,166,224,.22)", borderRadius: 999, padding: "4px 10px" }}>Plus</span>}
        </div>
        {!plus ? (
          <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>¿Tu confianza predice cómo salen tus decisiones? Reflejo Plus compara lo seguro que estabas con el resultado real y te dice si te calibras bien o pecas de exceso de confianza.</span>
        ) : cal.reviewed < 3 ? (
          <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>Revisa al menos 3 decisiones (con su confianza y su resultado) para ver tu calibración.</span>
        ) : (
          <>
            <span style={{ fontSize: 13, color: "#cfd2e4" }}>Aciertas en el <b style={{ color: "#fbfaff" }}>{cal.overallWellPct}%</b> de tus {cal.reviewed} decisiones revisadas.</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cal.buckets.filter((b) => b.total > 0).map((b) => {
                const pct = Math.round((b.well / b.total) * 100);
                return (
                  <div key={b.conf} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 78, fontSize: 12, color: "#cfd2e4" }}>Confianza {b.conf}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#9aa6e0" }} />
                    </div>
                    <span style={{ width: 46, textAlign: "right", fontSize: 11, color: "#aeb1c6" }}>{b.well}/{b.total}</span>
                  </div>
                );
              })}
            </div>
            {cal.insight && <span style={{ fontSize: 13, color: "#f5f3fb", lineHeight: 1.45 }}>{cal.insight}</span>}
          </>
        )}
      </section>

      {/* Registrar */}
      <section className="glass" style={{ borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Registrar una decisión</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label style={{ fontSize: 12, color: "#cfd2e4" }}>¿Qué vas a decidir?</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: contratar a la primera diseñadora" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 12, padding: 12, fontSize: 14, color: "#fbfaff" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <label style={{ fontSize: 12, color: "#cfd2e4" }}>¿Cuánta confianza tienes?</label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = conf >= n;
              return <button key={n} onClick={() => setConf(n)} aria-label={`Confianza ${n} de 5`} style={{ width: 34, height: 34, borderRadius: 999, border: on ? "none" : "1px solid rgba(255,255,255,.4)", background: on ? "#f0be86" : "rgba(255,255,255,.06)" }} />;
            })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <label style={{ fontSize: 12, color: "#cfd2e4" }}>Recuérdame revisar en</label>
          <div style={{ display: "flex", gap: 8 }}>
            {PLAZOS.map((p, i) => {
              const on = plazo === i;
              return <button key={p.label} onClick={() => setPlazo(i)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: on ? "1px solid #f0be86" : "1px solid rgba(255,255,255,.2)", background: on ? "rgba(240,190,134,.22)" : "transparent", color: on ? "#f3e2ce" : "#c4c6d8", fontSize: 12, fontWeight: on ? 700 : 600 }}>{p.label}</button>;
            })}
          </div>
        </div>
        {plus ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 12, color: "#cfd2e4" }}>Premortem (opcional)</label>
            <textarea value={premortem} onChange={(e) => setPremortem(e.target.value)} placeholder="Imagina que dentro de 6 meses salió mal. ¿Por qué?" style={{ width: "100%", boxSizing: "border-box", minHeight: 64, resize: "none", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5, color: "#fbfaff" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => setPreUpsell(true)} style={{ alignSelf: "flex-start", background: "rgba(154,166,224,.18)", color: "#c7cde4", border: "1px solid rgba(154,166,224,.4)", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>+ Premortem · Plus</button>
            {preUpsell && <span style={{ fontSize: 12, color: "#cfd2e4", lineHeight: 1.4 }}>Anticipar por qué una decisión podría salir mal es parte de Reflejo Plus.</span>}
          </div>
        )}
        <button onClick={save} disabled={!title.trim()} style={{ background: title.trim() ? "#f0be86" : "rgba(255,255,255,.12)", color: title.trim() ? "#23233a" : "#8a8ca0", border: "none", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
          {saved ? "Guardada ✓" : "Guardar decisión"}
        </button>
      </section>

      {futuras.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Pendientes de revisar</span>
          {sortByNewest(futuras).map((d) => (
            <div key={d.id} className="glass" style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 14, padding: "13px 14px" }}>
              <span style={{ flexGrow: 1, fontSize: 14 }}>{d.title}</span>
              <span style={{ flexShrink: 0, fontSize: 11, color: "#aeb1c6" }}>revisar el {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(d.reviewAt + "T00:00:00"))}</span>
            </div>
          ))}
        </section>
      )}

      {historial.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Historial</span>
          {historial.map((d) => {
            const b = outcomeBadge(d.outcome as string);
            return (
              <article key={d.id} className="glass" style={{ borderRadius: 14, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ flexGrow: 1, fontSize: 14 }}>{d.title}</span>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: b.color, background: b.bg, borderRadius: 999, padding: "4px 10px" }}>{d.outcome}</span>
                </div>
                {d.learning && <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>{d.learning}</span>}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
