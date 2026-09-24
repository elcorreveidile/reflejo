import type { CapacitorConfig } from "@capacitor/cli";

// Reflejo como app nativa (iOS/Android) con Capacitor.
//
// Estrategia MVP: el contenedor nativo carga la PWA ya desplegada (server.url),
// así reutilizamos tal cual el diario local-first, la sincronización, la IA y
// el resto de rutas de servidor, sin duplicar nada. La app sigue siendo
// local-first: una vez cargada, funciona offline (localStorage + service worker).
//
// Cuando haya dominio propio, cambia `server.url` por él.
const config: CapacitorConfig = {
  appId: "tech.wordnext.reflejo",
  appName: "Reflejo",
  // webDir es el fallback offline que se muestra si no hay red en el primer arranque.
  webDir: "native/www",
  server: {
    url: process.env.CAP_SERVER_URL || "https://reflejo-bay.vercel.app",
    cleartext: false,
  },
  backgroundColor: "#141628",
  ios: {
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#141628",
      showSpinner: false,
    },
  },
};

export default config;
