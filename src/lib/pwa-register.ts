/**
 * VetCare PWA — guarded service worker registration.
 *
 * The app-shell service worker (/sw.js) only registers in the real published
 * app. It NEVER registers in dev, inside iframes, or when the URL has
 * ?sw=off (kill switch). In any refused context we actively unregister stale
 * /sw.js registrations so previews always serve fresh code.
 *
 * Loaded dynamically from src/routes/__root.tsx (client-only, after hydration).
 */
import { registerSW } from "virtual:pwa-register";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.self !== window.top) return true; // iframe (embedded preview)
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;

  return false;
}

async function unregisterAppServiceWorkers(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((reg) => {
          const script =
            reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
          return script.endsWith("/sw.js");
        })
        .map((reg) => reg.unregister())
    );
  } catch {
    // best-effort cleanup
  }
}

export async function setupPwa(): Promise<void> {
  if (typeof window === "undefined") return;

  if (isRefusedContext()) {
    await unregisterAppServiceWorkers();
    return;
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      // Periodically check for updates while the app stays open.
      if (registration) {
        setInterval(() => void registration.update(), 60 * 60 * 1000);
      }
    },
  });
}
