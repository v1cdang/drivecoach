import { drivingConfig } from "@/lib/driving-config";
import type { TripEventType } from "@/lib/sensor-types";

const MESSAGES: Record<TripEventType, string> = {
  harsh_brake: "You're braking too hard",
  rapid_acceleration: "Ease acceleration",
  speeding: "Slow down",
};

/** Last time we spoke for each event category (client-only). */
const lastSpokenAt: Partial<Record<TripEventType, number>> = {};

/**
 * Speaks a short coaching phrase using Web Speech API, debounced per event type
 * so the driver is not flooded with audio.
 */
export function speakDrivingFeedback(eventType: TripEventType): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  const now = Date.now();
  const last = lastSpokenAt[eventType] ?? 0;
  if (now - last < drivingConfig.voiceDebounceMs) {
    return;
  }
  lastSpokenAt[eventType] = now;
  const utterance = new SpeechSynthesisUtterance(MESSAGES[eventType]);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
