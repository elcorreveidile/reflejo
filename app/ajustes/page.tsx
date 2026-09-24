"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useStore } from "../providers";

export default function AjustesPage() {
  const { data, setName, setHabitLabels, importData, resetData, email, plus, plan, plusUntil, syncing, requestLink, logout, syncNow } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [devLink, setDevLink] = useState("");

  async function sendLink() {
    if (!loginEmail.trim().includes("@")) { setLoginMsg("Escribe un email válido"); return; }
    setLoginMsg("Enviando…");
    setDevLink("");
    const r = await requestLink(loginEmail.trim());
    if (r.devLink) { setDevLink(r.devLink); setLoginMsg("Enlace listo (modo desarrollo):"); }
    else if (r.ok) setLoginMsg("Te hemos enviado un enlace a tu correo. Revisa la bandeja.");
    else setLoginMsg("No se pudo enviar el enlace. Inténtalo de nuevo.");
  }

  const labels = data.settings.habitLabels;

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reflejo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        importData(parsed);
        setMsg("Datos importados ✓");
      } catch {
        setMsg("No se pudo leer ese archivo");
      }
      setTimeout(() => setMsg(""), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const card = { borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 } as const;
  const label = { fontSize: 12, color: "#cfd2e4" } as const;
  const field = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 12, padding: 12, fontSize: 14, color: "#fbfaff" } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#cfd2e4", fontSize: 14 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        Hoy
      </Link>

      <header style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Ajustes</span>
        <span className="serif" style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>Tu perfil</span>
      </header>

      <section style={{ borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14, background: "rgba(62,76,126,.28)", border: "1px solid rgba(154,166,224,.4)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Sincronización</span>
        {email ? (
          <>
            <span style={{ fontSize: 13, color: "#cfd2e4" }}>Sesión iniciada como <b style={{ color: "#fbfaff" }}>{email}</b>. Tus datos se guardan en la nube y se sincronizan solos entre tus dispositivos.</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={syncNow} disabled={syncing} style={{ flex: 1, background: "#9aa6e0", color: "#141628", border: "none", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600, opacity: syncing ? 0.6 : 1 }}>{syncing ? "Sincronizando…" : "Sincronizar ahora"}</button>
              <button onClick={logout} style={{ flex: 1, background: "rgba(255,255,255,.10)", color: "#f5f3fb", border: "1px solid rgba(255,255,255,.22)", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Cerrar sesión</button>
            </div>
          </>
        ) : (
          <>
            <span style={label}>Entra con tu email para que tus datos te sigan entre el móvil y el escritorio. Te enviamos un enlace, sin contraseñas.</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" inputMode="email" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="tu@email.com" style={{ ...field, flex: 1 }} />
              <button onClick={sendLink} style={{ flexShrink: 0, background: "#9aa6e0", color: "#141628", border: "none", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Enviar enlace</button>
            </div>
            {loginMsg && <span style={{ fontSize: 13, color: "#cfd2e4" }}>{loginMsg}</span>}
            {devLink && <a href={devLink} style={{ fontSize: 13, color: "#f0be86", fontWeight: 600, wordBreak: "break-all" }}>{devLink}</a>}
          </>
        )}
      </section>

      <Link href="/plus" style={{ textDecoration: "none", borderRadius: 20, padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: plus ? "rgba(91,140,130,.24)" : "rgba(240,190,140,.16)", border: plus ? "1px solid rgba(143,208,184,.5)" : "1px solid rgba(240,190,140,.4)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fbfaff" }}>{plus ? "Reflejo Plus ✓" : "✨ Reflejo Plus"}</span>
          <span style={{ fontSize: 13, color: "#e7e7f0", lineHeight: 1.4 }}>
            {plus
              ? plan === "lifetime" ? "Compra única · para siempre"
                : plan === "cortesía" ? "Acceso de cortesía"
                : plusUntil ? `Suscripción · renueva el ${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(plusUntil))}`
                : "Suscripción activa"
              : "IA, conversa con tu diario y herramientas avanzadas"}
          </span>
        </div>
        <span style={{ color: plus ? "#8fd0b8" : "#f0be86", fontSize: 20 }}>{"→"}</span>
      </Link>

      <section className="glass" style={card}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Nombre</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label style={label}>Con el que te saluda la app</label>
          <input type="text" value={data.settings.name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" style={field} />
        </div>
      </section>

      <section className="glass" style={card}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Tus hábitos</span>
        <span style={label}>Cuatro hábitos para el seguimiento diario. Deja uno en blanco para ocultarlo.</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {labels.map((l, i) => (
            <input
              key={i}
              type="text"
              value={l}
              onChange={(e) => { const next = [...labels]; next[i] = e.target.value; setHabitLabels(next); }}
              placeholder={`Hábito ${i + 1}`}
              style={field}
            />
          ))}
        </div>
      </section>

      <section className="glass" style={card}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Tus datos</span>
        <span style={label}>Todo vive solo en este dispositivo. Guarda una copia o pásala a otro con exportar e importar.</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportData} style={{ flex: 1, background: "#f0be86", color: "#23233a", border: "none", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Exportar</button>
          <button onClick={() => fileRef.current?.click()} style={{ flex: 1, background: "rgba(255,255,255,.10)", color: "#f5f3fb", border: "1px solid rgba(255,255,255,.22)", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Importar</button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImport} style={{ display: "none" }} />
        </div>
        {msg && <span style={{ fontSize: 13, color: "#8fd0b8" }}>{msg}</span>}
      </section>

      <section style={{ borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12, background: "rgba(217,142,79,.14)", border: "1px solid rgba(240,190,140,.3)" }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Borrar todo</span>
        <span style={label}>Elimina de este dispositivo tus entradas, estados, prácticas y decisiones. No se puede deshacer.</span>
        {confirmReset ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmReset(false)} style={{ flex: 1, background: "rgba(255,255,255,.10)", color: "#d8daea", border: "1px solid rgba(255,255,255,.22)", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Cancelar</button>
            <button onClick={() => { resetData(); setConfirmReset(false); setMsg("Datos borrados"); setTimeout(() => setMsg(""), 3000); }} style={{ flex: 1, background: "#c9605a", color: "#fff", border: "none", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Sí, borrar todo</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} style={{ alignSelf: "flex-start", background: "transparent", color: "#e79b95", border: "1px solid rgba(201,96,90,.6)", padding: "10px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600 }}>Borrar mis datos</button>
        )}
      </section>

      <span style={{ fontSize: 12, color: "#8a8ca0", textAlign: "center", paddingBottom: 8 }}>Reflejo · local-first · funciona sin conexión y sincroniza si quieres</span>
    </div>
  );
}
