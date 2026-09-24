"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/app/providers";
import { backgroundLayer } from "@/lib/backgrounds";
import NavIcon, { type IconName } from "./NavIcon";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Hoy", icon: "hoy" },
  { href: "/diario", label: "Diario", icon: "diario" },
  { href: "/estados", label: "Estados", icon: "estados" },
  { href: "/practicas", label: "Prácticas", icon: "practicas" },
  { href: "/decisiones", label: "Decisiones", icon: "decisiones" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { data } = useStore();
  const pathname = usePathname();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      {/* Fondo a pantalla completa + velo */}
      <div style={{ position: "fixed", inset: 0, zIndex: -2, ...backgroundLayer(data.settings) }} />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background:
            "linear-gradient(180deg,rgba(16,16,30,.52) 0%,rgba(16,16,30,.68) 52%,rgba(16,16,30,.9) 100%)",
        }}
      />

      <main
        className="no-scrollbar"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "30px 20px 108px",
          minHeight: "100dvh",
        }}
      >
        {children}
      </main>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: "rgba(16,16,28,.6)",
          borderTop: "1px solid rgba(255,255,255,.14)",
          WebkitBackdropFilter: "blur(14px)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", padding: "8px 6px 14px" }}>
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 0",
                  color: active ? "#f0be86" : "#c4c6d8",
                }}
              >
                <NavIcon name={item.icon} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
