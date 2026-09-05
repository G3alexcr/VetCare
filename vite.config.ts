// Vite + TanStack Start configuration (standalone).
// Plugins:
//   - tanstackStart: TanStack Start SSR (client + server environments)
//   - viteReact: React fast refresh
//   - tailwindcss: Tailwind CSS v4
//   - tsConfigPaths: resolves the "@/*" alias from tsconfig.json
//   - VitePWA: generates the service worker + web app manifest
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro(),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      // Registration is handled exclusively by src/lib/pwa-register.ts
      injectRegister: null,
      // Serve the web manifest in dev too (avoids 404 on /manifest.webmanifest).
      // The service worker still never registers in dev (see pwa-register.ts).
      devOptions: { enabled: true },
      filename: "sw.js",
      manifestFilename: "manifest.webmanifest",
      manifest: {
        id: "/",
        name: "VetCare — Gestión para Clínicas Veterinarias",
        short_name: "VetCare",
        description:
          "Gestiona clientes, mascotas, agenda, consultas, hospitalización, caja e inventario de tu clínica veterinaria.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#009d9e",
        background_color: "#f8fbfb",
        categories: ["medical", "business", "productivity"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,svg,png,woff2}"],
        // No navigateFallback: HTML is SSR — navigations use NetworkFirst below.
        runtimeCaching: [
          {
            // HTML navigations: network first, cached pages as offline fallback.
            // /~oauth must always hit the network (OAuth broker paths).
            urlPattern: ({ request, url }: { request: Request; url: URL }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
            handler: "NetworkFirst",
            options: {
              cacheName: "vetcare-pages",
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 60, maxAgeSeconds: 86400 },
            },
          },
          {
            // Same-origin hashed build assets: cache first.
            urlPattern: ({ url, request }: { url: URL; request: Request }) =>
              url.origin === self.location.origin &&
              ["script", "style", "font", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "vetcare-assets",
              expiration: { maxEntries: 300, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],
});
