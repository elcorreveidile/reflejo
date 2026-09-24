"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useStore } from "../providers";
import { isNative } from "@/lib/native";
import { rcConfigure, rcOfferings, rcPurchase, rcRestore, rcHasEntitlement, type RcPackage } from "@/lib/revenuecat";

interface PlanInfo {
  id: string;
  mode: "subscription" | "payment";
  amount: number | null;
  currency: string | null;
  interval: string | null;
}

const PERKS = [
  "Asistente de IA en el diario (mejorar preguntas)",
  "Conversa con tu diario y pregúntale lo que quieras",
  "Informe mensual y resumen con IA",
  "Todos los ejercicios de prácticas",
  "Decisiones pro: calibración y premortem",
];

function fmtPrice(p: PlanInfo): string {
  if (p.amount == null || !p.currency) return "";
  const s = new Intl.NumberFormat("es-ES", { style: "currency", currency: p.currency.toUpperCase() }).format(p.amount / 100);
  if (p.interval === "month") return `${s}/mes`;
  if (p.interval === "year") return `${s}/año`;
  return s;
}

export default function PlusPage() {
  const { email, uid, plus, plan, plusUntil, refreshMe } = useStore();
  const [native, setNative] = useState(false);
  // Web (Stripe)
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  // Nativo (RevenueCat)
  const [rcPkgs, setRcPkgs] = useState<RcPackage[]>([]);
  const [rcReady, setRcReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [banner, setBanner] = useState<"ok" | "cancel" | null>(null);

  useEffect(() => {
    setNative(isNative());
    const q = new URLSearchParams(window.location.search);
    if (q.get("ok")) setBanner("ok");
    else if (q.get("cancel")) setBanner("cancel");
  }, []);

  // Web: precios reales desde Stripe.
  useEffect(() => {
    if (native) return;
    fetch("/api/billing/plans")
      .then((r) => r.json())
      .then((j) => { setPlans(j.plans ?? []); setConfigured(!!j.configured); })
      .catch(() => setConfigured(false));
  }, [native]);

  // Nativo: configura RevenueCat con la cuenta y carga los paquetes de la tienda.
  useEffect(() => {
    if (!native || !uid) return;
    let alive = true;
    (async () => {
      try {
        const ok = await rcConfigure(uid);
        if (!ok) { if (alive) setRcReady(false); return; }
        const [pkgs, entitled] = await Promise.all([rcOfferings(), rcHasEntitlement()]);
        if (!alive) return;
        setRcPkgs(pkgs);
        setRcReady(true);
        if (entitled) refreshMe(); // la tienda ya lo tiene: sincroniza la cuenta
      } catch {
        if (alive) setRcReady(false);
      }
    })();
    return () => { alive = false; };
  }, [native, uid, refreshMe]);

  // Tras una compra, el webhook tarda un poco en marcar la cuenta: reintenta unas veces.
  const pollPlus = useCallback(async () => {
    for (let i = 0; i < 5; i++) {
      if (await refreshMe()) return true;
      await new Promise((r) => setTimeout(r, 2000));
    }
    return false;
  }, [refreshMe]);

  async function checkout(planId: string) {
    if (!email) { setNote("Entra con tu cuenta desde Ajustes antes de comprar."); return; }
    setBusy(planId);
    setNote("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const j = await res.json();
      if (j.url) { window.location.href = j.url; return; }
      if (j.error === "auth") setNote("Entra con tu cuenta desde Ajustes antes de comprar.");
      else if (j.error === "no-stripe") setNote("El pago aún no está configurado.");
      else setNote("No se pudo iniciar el pago. Inténtalo de nuevo.");
    } catch {
      setNote("Sin conexión con el pago.");
    } finally {
      setBusy(null);
    }
  }

  async function portal() {
    setBusy("portal");
    setNote("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const j = await res.json();
      if (j.url) { window.location.href = j.url; return; }
      setNote("No se pudo abrir la gestión de la suscripción.");
    } catch {
      setNote("Sin conexión.");
    } finally {
      setBusy(null);
    }
  }

  async function buyNative(identifier: string) {
    if (!email || !uid) { setNote("Entra con tu cuenta desde Ajustes antes de comprar."); return; }
    setBusy(identifier);
    setNote("");
    try {
      const active = await rcPurchase(identifier);
      if (active) {
        setNote("Compra hecha. Activando tu cuenta…");
        const done = await pollPlus();
        setNote(done ? "" : "Compra hecha. Puede tardar un momento en activarse.");
      } else {
        setNote("La compra no se completó.");
      }
    } catch (e) {
      const msg = String((e as { message?: string })?.message || "");
      setNote(/cancel/i.test(msg) ? "Compra cancelada." : "No se pudo completar la compra.");
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    setBusy("restore");
    setNote("");
    try {
      const active = await rcRestore();
      if (active) { await pollPlus(); setNote("Compras restauradas."); }
      else setNote("No encontramos compras que restaurar.");
    } catch {
      setNote("No se pudieron restaurar las compras.");
    } finally {
      setBusy(null);
    }
  }

  const sub = plans.find((p) => p.id === "sub");
  const lifetime = plans.find((p) => p.id === "lifetime");
  const untilText = plusUntil ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(plusUntil)) : null;

  const cardBase = { borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Link href="/ajustes" style={{ display: "flex", alignItems: "center", gap: 6, color: "#cfd2e4", fontSize: 14 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        Ajustes
      </Link>

      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#cfd2e4", fontWeight: 600 }}>Reflejo Plus</span>
        <span className="serif" style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 500, color: "#fbfaff" }}>Lleva tu introspección más lejos</span>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: "#cfd2e4" }}>La app es tuya y gratis para siempre. Plus añade la IA y las herramientas avanzadas.</span>
      </header>

      {banner === "ok" && (
        <div style={{ borderRadius: 14, padding: "12px 14px", background: "rgba(91,140,130,.28)", border: "1px solid rgba(143,208,184,.5)", fontSize: 14, color: "#eafff6" }}>
          ¡Gracias! Tu pago se está procesando. Reflejo Plus se activa en unos segundos.
        </div>
      )}
      {banner === "cancel" && (
        <div style={{ borderRadius: 14, padding: "12px 14px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)", fontSize: 14, color: "#e7e7f0" }}>
          Pago cancelado. Puedes hacerte Plus cuando quieras.
        </div>
      )}

      {/* Qué incluye */}
      <section className="glass" style={cardBase}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#fbfaff" }}>✨ Qué incluye</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {PERKS.map((t) => (
            <div key={t} style={{ display: "flex", gap: 10 }}>
              <span style={{ flexShrink: 0, color: "#8fd0b8", marginTop: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.45, color: "#f5f3fb" }}>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {plus ? (
        <section style={{ ...cardBase, background: "rgba(91,140,130,.24)", border: "1px solid rgba(143,208,184,.5)" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fbfaff" }}>Ya eres Plus ✓</span>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "#e7e7f0" }}>
            {plan === "lifetime" ? "Compra única: Reflejo Plus es tuyo para siempre."
              : plan === "cortesía" ? "Acceso de cortesía activado."
              : plan === "native" ? (untilText ? `Suscripción activa (app). Se renueva el ${untilText}.` : "Suscripción activa (app).")
              : untilText ? `Suscripción activa. Se renueva el ${untilText}.`
              : "Suscripción activa."}
          </span>
          {plan === "sub" && !native && (
            <button onClick={portal} disabled={busy === "portal"} style={{ alignSelf: "flex-start", background: "#9aa6e0", color: "#141628", border: "none", padding: "11px 18px", borderRadius: 999, fontSize: 14, fontWeight: 700, opacity: busy === "portal" ? 0.6 : 1 }}>
              {busy === "portal" ? "Abriendo…" : "Gestionar suscripción"}
            </button>
          )}
          {plan === "native" && (
            <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>Gestiona o cancela tu suscripción desde la App Store o Google Play.</span>
          )}
        </section>
      ) : native ? (
        // --- App nativa: RevenueCat ---
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!email ? (
            <section className="glass" style={cardBase}>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "#cfd2e4" }}>Para hacerte Plus, primero <Link href="/ajustes" style={{ color: "#f0be86", fontWeight: 600 }}>entra con tu cuenta</Link> en Ajustes.</span>
            </section>
          ) : rcReady === false ? (
            <section className="glass" style={cardBase}>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "#cfd2e4" }}>Las compras no están disponibles ahora mismo. Inténtalo de nuevo más tarde.</span>
            </section>
          ) : rcReady === null ? (
            <section className="glass" style={cardBase}>
              <span style={{ fontSize: 14, color: "#cfd2e4" }}>Cargando opciones…</span>
            </section>
          ) : (
            <>
              {rcPkgs.map((p, i) => (
                <section key={p.identifier} style={{ ...cardBase, ...(i === 0 ? { background: "rgba(62,76,126,.3)", border: "1px solid rgba(154,166,224,.5)" } : {}) }} className={i === 0 ? undefined : "glass"}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fbfaff" }}>{p.title}</span>
                    <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: "#fbfaff" }}>{p.priceString}</span>
                  </div>
                  <button onClick={() => buyNative(p.identifier)} disabled={!!busy} style={{ background: i === 0 ? "#f0be86" : "rgba(255,255,255,.12)", color: i === 0 ? "#23233a" : "#f5f3fb", border: i === 0 ? "none" : "1px solid rgba(255,255,255,.28)", padding: "13px 18px", borderRadius: 999, fontSize: 15, fontWeight: 700, opacity: busy === p.identifier ? 0.6 : 1 }}>
                    {busy === p.identifier ? "Procesando…" : "Hazte Plus"}
                  </button>
                </section>
              ))}
              {rcPkgs.length === 0 && (
                <section className="glass" style={cardBase}>
                  <span style={{ fontSize: 14, color: "#cfd2e4", lineHeight: 1.5 }}>No hay planes disponibles ahora mismo.</span>
                </section>
              )}
              <button onClick={restore} disabled={!!busy} style={{ alignSelf: "center", background: "none", border: "none", color: "#9aa6e0", fontSize: 13, fontWeight: 600, textDecoration: "underline" }}>
                Restaurar compras
              </button>
            </>
          )}
        </div>
      ) : configured === false ? (
        <section className="glass" style={cardBase}>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "#cfd2e4" }}>El pago todavía no está configurado en este entorno. Vuelve pronto.</span>
        </section>
      ) : (
        // --- Web: Stripe ---
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sub && (
            <section style={{ ...cardBase, background: "rgba(62,76,126,.3)", border: "1px solid rgba(154,166,224,.5)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fbfaff" }}>Suscripción</span>
                <span className="serif" style={{ fontSize: 24, fontWeight: 600, color: "#fbfaff" }}>{fmtPrice(sub)}</span>
              </div>
              <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>Todo Plus mientras dure. Cancela cuando quieras.</span>
              <button onClick={() => checkout("sub")} disabled={busy === "sub"} style={{ background: "#f0be86", color: "#23233a", border: "none", padding: "13px 18px", borderRadius: 999, fontSize: 15, fontWeight: 700, opacity: busy === "sub" ? 0.6 : 1 }}>
                {busy === "sub" ? "Abriendo pago…" : "Suscribirme"}
              </button>
            </section>
          )}
          {lifetime && (
            <section className="glass" style={cardBase}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fbfaff" }}>Compra única</span>
                <span className="serif" style={{ fontSize: 24, fontWeight: 600, color: "#fbfaff" }}>{fmtPrice(lifetime)}</span>
              </div>
              <span style={{ fontSize: 13, color: "#cfd2e4", lineHeight: 1.45 }}>Un solo pago. Reflejo Plus tuyo para siempre, sin cuotas.</span>
              <button onClick={() => checkout("lifetime")} disabled={busy === "lifetime"} style={{ background: "rgba(255,255,255,.12)", color: "#f5f3fb", border: "1px solid rgba(255,255,255,.28)", padding: "13px 18px", borderRadius: 999, fontSize: 15, fontWeight: 700, opacity: busy === "lifetime" ? 0.6 : 1 }}>
                {busy === "lifetime" ? "Abriendo pago…" : "Comprar una vez"}
              </button>
            </section>
          )}
          {!email && (
            <span style={{ fontSize: 13, color: "#f1d6a8", lineHeight: 1.45 }}>Para comprar, primero <Link href="/ajustes" style={{ color: "#f0be86", fontWeight: 600 }}>entra con tu cuenta</Link> en Ajustes.</span>
          )}
        </div>
      )}

      {note && <span style={{ fontSize: 13, color: "#f1d6a8", lineHeight: 1.4 }}>{note}</span>}

      <span style={{ fontSize: 12, color: "#8a8ca0", textAlign: "center", lineHeight: 1.5, paddingBottom: 8 }}>
        {native ? "Pago gestionado por la tienda de tu dispositivo. Sin permanencia." : "Pago seguro con Stripe. Sin permanencia. La app sigue funcionando sin conexión."}
      </span>
    </div>
  );
}
