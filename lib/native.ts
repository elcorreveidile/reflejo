import { Capacitor } from "@capacitor/core";

/** ¿Corremos dentro del contenedor nativo (iOS/Android) o en la web? */
export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function platform(): "ios" | "android" | "web" {
  try {
    const p = Capacitor.getPlatform();
    return p === "ios" || p === "android" ? p : "web";
  } catch {
    return "web";
  }
}

// Claves públicas del SDK de RevenueCat (una por tienda; son claves de cliente, no secretas).
export function revenueCatApiKey(): string | null {
  const p = platform();
  if (p === "ios") return process.env.NEXT_PUBLIC_RC_IOS_KEY || null;
  if (p === "android") return process.env.NEXT_PUBLIC_RC_ANDROID_KEY || null;
  return null;
}

export function revenueCatEntitlement(): string {
  return process.env.NEXT_PUBLIC_RC_ENTITLEMENT || "plus";
}
