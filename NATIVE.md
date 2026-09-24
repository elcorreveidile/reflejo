# Reflejo como app nativa (iOS / Android)

Reflejo es una **PWA local-first**. Para llevarla a las tiendas la envolvemos con
**Capacitor**: un contenedor nativo cuyo WebView carga la app ya desplegada
(`server.url` en `capacitor.config.ts`). Así reutilizamos tal cual el diario, la
sincronización, la IA y el resto de la web, sin reescribir nada. Una vez cargada,
sigue funcionando sin conexión (localStorage + service worker).

Los proyectos nativos (`/ios`, `/android`) **no se versionan**: se generan en local
con `npx cap add` (están en `.gitignore`). Lo que sí se versiona es la config, los
scripts y esta guía.

## Requisitos

- **Android:** Android Studio (JDK 17 + Android SDK).
- **iOS:** un Mac con Xcode y CocoaPods (`sudo gem install cocoapods`).

## Puesta en marcha

```bash
npm install                 # instala también Capacitor
npm run cap:add:android     # genera /android (una sola vez)
npm run cap:add:ios         # genera /ios (una sola vez; solo en Mac)
npm run cap:sync            # copia config + plugins a los proyectos nativos
npm run cap:android         # abre Android Studio
npm run cap:ios             # abre Xcode
```

Desde Android Studio / Xcode se ejecuta en emulador o dispositivo y se firma para
subir a Google Play / App Store.

## Configuración

`capacitor.config.ts`:

- `appId`: `tech.wordnext.reflejo` — cámbialo si registras otro identificador.
- `server.url`: por defecto `https://reflejo-bay.vercel.app`. Cámbialo por el
  dominio propio cuando lo tengas, o pásalo por la variable `CAP_SERVER_URL` al
  hacer `cap sync`.
- `webDir` (`native/www`): pantalla de reserva que solo se ve si no hay red en el
  primer arranque.

## ⚠️ Cobros en la app (importante antes de publicar)

El paywall actual usa **Stripe web** (`/plus`). Apple y Google **exigen su propio
sistema de compra para bienes digitales** dentro de la app:

- **iOS (App Store):** las suscripciones/compras digitales deben usar **In-App
  Purchase (StoreKit)**. Un checkout web de Stripe para desbloquear funciones se
  rechaza en revisión.
- **Android (Google Play):** igual con **Google Play Billing**.

Plan para la versión nativa (siguiente iteración, no incluida aquí):

1. Integrar **RevenueCat** (`@revenuecat/purchases-capacitor`), que unifica
   StoreKit + Play Billing.
2. Crear los productos de suscripción y compra única en App Store Connect y en
   Google Play Console, y mapearlos en RevenueCat.
3. En la app, **detectar plataforma** (`Capacitor.getPlatform()`): en `web` seguir
   con Stripe; en `ios`/`android` usar RevenueCat.
4. Conceder el entitlement `plus` desde el webhook de RevenueCat (server-to-server),
   igual que hoy hace el webhook de Stripe con `User.plus`.

Mientras tanto, la app funciona en las tiendas si el acceso a Plus se hace por web
fuera del flujo nativo, pero **para monetizar en iOS/Android hay que hacer el paso
de RevenueCat**.

## Notas

- La versión de Capacitor está fijada en la línea **6** (estable y ampliamente
  soportada). Actualizar a la 8 es un salto mayor que se hará aparte.
- Los iconos/splash nativos se generan con `@capacitor/assets` a partir de un
  icono base cuando preparemos el envío a tienda.
