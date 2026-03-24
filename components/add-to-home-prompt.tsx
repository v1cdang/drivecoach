"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Surfaces a simple install banner when the browser fires `beforeinstallprompt`
 * (Chrome/Edge/Android). iOS Safari has no event; we show manual instructions instead.
 */
export function AddToHomePrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIos(ios);
    const onBip = (e: Event): void => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);
  const onInstall = useCallback(async (): Promise<void> => {
    if (deferred === null) {
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);
  if (dismissed) {
    return null;
  }
  if (deferred !== null) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-20 mx-auto max-w-lg rounded-xl border border-[#dce6f7] bg-white p-4 shadow-lg shadow-[#0b2f6b]/10">
        <p className="text-sm text-[#1d447e]">Install DriveCoach for quick access from your home screen.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void onInstall()}
            className="flex-1 rounded-lg bg-[#10d4c5] py-3 text-base font-semibold text-[#05244f] active:bg-[#0bc4b6]"
          >
            Add to Home Screen
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-[#b9cde9] px-4 py-3 text-sm text-[#3d6296]"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }
  if (isIos) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-20 mx-auto max-w-lg rounded-xl border border-[#dce6f7] bg-white p-4 shadow-lg shadow-[#0b2f6b]/10">
        <p className="text-sm text-[#1d447e]">
          On iPhone: tap Share, then &quot;Add to Home Screen&quot; to install DriveCoach.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-3 w-full rounded-lg border border-[#b9cde9] py-2 text-sm text-[#3d6296]"
        >
          OK
        </button>
      </div>
    );
  }
  return null;
}
