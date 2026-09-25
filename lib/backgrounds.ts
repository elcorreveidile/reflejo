import type { CSSProperties } from "react";
import type { BackgroundId, Settings } from "./types";

export const BACKGROUNDS: { id: Exclude<BackgroundId, "custom">; label: string; css: string }[] = [
  { id: "reflejo", label: "Reflejo", css: "url(/backgrounds/reflejo.jpg)" },
  { id: "cafe", label: "Café", css: "url(/backgrounds/cafe.jpg)" },
  { id: "noche", label: "Noche", css: "linear-gradient(160deg,#2a3360,#141a33)" },
  { id: "bosque", label: "Bosque", css: "linear-gradient(160deg,#264734,#10241a)" },
  { id: "arena", label: "Arena", css: "linear-gradient(160deg,#c99c64,#7c5133)" },
];

/** Estilo del fondo (capa a pantalla completa, tras el velo). */
export function backgroundLayer(settings: Settings): CSSProperties {
  if (settings.background === "custom" && settings.customBg) {
    return { backgroundImage: `url(${settings.customBg})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const found = BACKGROUNDS.find((b) => b.id === settings.background) ?? BACKGROUNDS[0];
  return { backgroundImage: found.css, backgroundSize: "cover", backgroundPosition: "35% center" };
}

/** Miniatura para el selector. */
export function backgroundThumb(id: BackgroundId, customBg?: string): CSSProperties {
  if (id === "custom") {
    return customBg
      ? { backgroundImage: `url(${customBg})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {};
  }
  const found = BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
  return { backgroundImage: found.css, backgroundSize: "cover", backgroundPosition: "center" };
}
