import { isNative, revenueCatApiKey, revenueCatEntitlement } from "./native";

// Envoltura de RevenueCat con carga dinámica: el plugin nativo solo se importa
// dentro del contenedor iOS/Android; en la web nunca se toca.

export interface RcPackage {
  identifier: string;
  title: string;
  priceString: string;
}

let configured = false;

async function rc() {
  return import("@revenuecat/purchases-capacitor");
}

/** Configura el SDK y ata la compra a la cuenta (appUserID = nuestro User.id). */
export async function rcConfigure(appUserID: string): Promise<boolean> {
  if (!isNative()) return false;
  const apiKey = revenueCatApiKey();
  if (!apiKey) return false;
  const { Purchases } = await rc();
  if (!configured) {
    await Purchases.configure({ apiKey, appUserID });
    configured = true;
  } else {
    await Purchases.logIn({ appUserID });
  }
  return true;
}

export async function rcHasEntitlement(): Promise<boolean> {
  const { Purchases } = await rc();
  const { customerInfo } = await Purchases.getCustomerInfo();
  return !!customerInfo.entitlements.active[revenueCatEntitlement()];
}

export async function rcOfferings(): Promise<RcPackage[]> {
  const { Purchases } = await rc();
  const offerings = await Purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  return pkgs.map((p) => ({
    identifier: p.identifier,
    title: p.product.title,
    priceString: p.product.priceString,
  }));
}

/** Compra un paquete; devuelve si la compra deja el derecho activo. */
export async function rcPurchase(identifier: string): Promise<boolean> {
  const { Purchases } = await rc();
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find((p) => p.identifier === identifier);
  if (!pkg) return false;
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return !!customerInfo.entitlements.active[revenueCatEntitlement()];
}

export async function rcRestore(): Promise<boolean> {
  const { Purchases } = await rc();
  const { customerInfo } = await Purchases.restorePurchases();
  return !!customerInfo.entitlements.active[revenueCatEntitlement()];
}
