"use client";

import { useEffect } from "react";

/**
 * Registers the lightweight `sw.js` so the app meets installability criteria over HTTPS.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = async (): Promise<void> => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        /* offline or unsupported; PWA still usable in-browser */
      }
    };
    void register();
  }, []);
  return null;
}
