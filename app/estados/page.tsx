"use client";

import { useState } from "react";
import { useStore } from "../providers";
import { recentSeries } from "@/lib/store";

const DIMS = [
  { key: "animo", name: "Ánimo", hint: "de bajo a pleno", color: "#9aa6e0" },
  { key: "energia", name: "Energía", hint: "de agotado a con fuerza", color: "#f0be86" },
  { key: "foco", name: "Foco", hint: "de disperso a concentrado", color: "#8fd0b8" },
] as const;

const MOMENTS = ["Mañana", "Tarde", "Noche"];

export default function EstadosPage() {
  const { data, addLog } = useStore();
  const [vals, setVals] = useState<{ animo: number; energia: number; foco: number }>({ animo: 3, energia: 3, foco: 3 });
  const [moment, setMoment] = useState(1);
  const [saved, setSaved] = useState(false);

  const series = recentSeries(data, 7);

  function onSave() {
    addLog({ animo: vals.animo, energia: vals.energia, foco: vals.foco, moment });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Estados</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>Registra este momento</span>
      </header>

      <section className="glass" style={{ borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
        {DIMS.map((d) => (
          <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{d.name}</span>
              <span style={{ fontSize: 12, color: "#aeb1c6" }}>{d.hint}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = vals[d.key] >= n;
                return (
                  <button
                    key={n}
                    onClick={() => setVals((v) => ({ ...v, [d.key]: n }))}
                    aria-label={`${d.name} ${n} de 5`}
                    style={{ width: 36, height: 36, borderRadius: 999, border: on ? "none" : "1px solid rgba(255,255,255,.4)", background: on ? "#f0be86" : "rgba(255,255,255,.06)" }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Momento del día</span>
        <div style={{ display: "flex", gap: 8 }}>
          {MOMENTS.map((label, i) => {
            const on = moment === i;
            return (
              <button key={label} onClick={() => setMoment(i)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: on ? "1px solid #f0be86" : "1px solid rgba(255,255,255,.22)", background: on ? "#f0be86" : "rgba(255,255,255,.06)", color: on ? "#23233a" : "#d8daea", fontSize: 13, fontWeight: on ? 700 : 600 }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onSave} style={{ background: "#f0be86", color: "#23233a", border: "none", padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 600 }}>
        {saved ? "Guardado ✓" : "Guardar estado"}
      </button>

      <section className="glass" style={{ borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Esta semana</span>
        {DIMS.map((d) => (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 62, fontSize: 13, color: "#cfd2e4" }}>{d.name}</span>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6, height: 40 }}>
              {series.map((pt) => {
                const v = pt[d.key];
                const h = v === null ? 4 : 6 + (v / 5) * 34;
                return (
                  <div key={pt.date} title={pt.date} style={{ flex: 1, height: h, borderRadius: 4, background: v === null ? "rgba(255,255,255,.12)" : d.color }} />
                );
              })}
            </div>
          </div>
        ))}
        <span style={{ fontSize: 11, color: "#aeb1c6" }}>Últimos 7 días. Registra a diario para ver tus patrones.</span>
      </section>
    </div>
  );
}
