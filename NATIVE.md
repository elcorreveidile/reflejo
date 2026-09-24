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

**Ya está integrado RevenueCat** (`@revenuecat/purchases-capacitor`), que unifica
StoreKit + Play Billing. La página `/plus` **detecta plataforma**
(`Capacitor.getPlatform()`): en `web` usa Stripe; en `ios`/`android` usa
RevenueCat. El derecho `plus` se concede en la cuenta desde el **webhook de
RevenueCat** (`/api/revenuecat/webhook`), igual que el de Stripe, así el
entitlement viaja entre web y app. La compra se ata a la cuenta con
`Purchases.logIn(userId)` (el `appUserID` de RevenueCat es nuestro `User.id`).

Para activarlo (cuando prepares el envío a tienda):

1. **RevenueCat**: crea un proyecto, añade las apps de iOS y Android, y define un
   **entitlement** (por defecto lo llamamos `plus`) con sus productos/ofertas.
2. **App Store Connect / Google Play Console**: crea los productos de
   suscripción y/o compra única, y enlázalos en RevenueCat.
3. **Vercel envs**:
   - `NEXT_PUBLIC_RC_IOS_KEY`, `NEXT_PUBLIC_RC_ANDROID_KEY` — claves **públicas**
     del SDK (una por tienda).
   - `NEXT_PUBLIC_RC_ENTITLEMENT` — el id del entitlement si no es `plus`.
   - `REVENUECAT_WEBHOOK_AUTH` — un valor secreto que tú eliges.
4. **Webhook en RevenueCat** → `https://<tu-dominio>/api/revenuecat/webhook`, con
   el header `Authorization` igual a `REVENUECAT_WEBHOOK_AUTH`.
5. `npm run cap:sync` para instalar el plugin nativo en los proyectos iOS/Android.

Prueba (sandbox de la tienda): entra con tu cuenta → `/plus` en la app nativa →
compra → el webhook marca `plus` en tu cuenta → la IA y las prácticas Plus quedan
desbloqueadas (y también en la web con la misma cuenta). «Restaurar compras»
recupera una compra previa en un dispositivo nuevo.

> La web sigue cobrando por Stripe; el flujo nativo por RevenueCat. Ninguna
> depende de la otra.

## Notas

- La versión de Capacitor está fijada en la línea **6** (estable y ampliamente
  soportada). Actualizar a la 8 es un salto mayor que se hará aparte.
- Los iconos/splash nativos se generan con `@capacitor/assets` a partir de un
  icono base cuando preparemos el envío a tienda.
