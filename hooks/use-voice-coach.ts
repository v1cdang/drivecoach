"use client";

import type { TripEvent } from "@/lib/sensor-types";
import { useCallback, useEffect, useRef } from "react";

type VoiceCoachConfig = {
  readonly cooldownMs: number;
};

const EVENT_MESSAGES: Record<TripEvent["type"], string> = {
  speeding: "You're going too fast",
  harsh_brake: "Brake more gently",
  rapid_acceleration: "Ease acceleration",
};

const CRITICAL_EVENT_TYPES: readonly TripEvent["type"][] = ["speeding", "harsh_brake"];

function isCriticalEventType(eventType: TripEvent["type"]): boolean {
  return CRITICAL_EVENT_TYPES.includes(eventType);
}

/**
 * Speaks coaching feedback with anti-spam safeguards for mobile driving use.
 */
export function useVoiceCoach(customConfig?: Partial<VoiceCoachConfig>): {
  readonly speakEvent: (event: TripEvent) => void;
} {
  const configRef = useRef<VoiceCoachConfig>({
    cooldownMs: 5500,
    ...customConfig,
  });
  configRef.current = {
    cooldownMs: 5500,
    ...customConfig,
  };
  const lastSpokenAtRef = useRef<number>(0);
  const lastSpokenTypeRef = useRef<TripEvent["type"] | null>(null);
  const pendingTypeRef = useRef<TripEvent["type"] | null>(null);
  const speakEvent = useCallback((event: TripEvent): void => {
    if (typeof window === "undefined" || window.speechSynthesis === undefined) {
      return;
    }
    const now = Date.now();
    const isInCooldown = now - lastSpokenAtRef.current < configRef.current.cooldownMs;
    const isRepeatedType = lastSpokenTypeRef.current === event.type;
    if (isRepeatedType) {
      return;
    }
    if (isInCooldown) {
      pendingTypeRef.current = event.type;
      if (isCriticalEventType(event.type)) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    const utterance = new SpeechSynthesisUtterance(EVENT_MESSAGES[event.type]);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      const pendingType = pendingTypeRef.current;
      pendingTypeRef.current = null;
      if (pendingType === null || pendingType === lastSpokenTypeRef.current) {
        return;
      }
      const pendingUtterance = new SpeechSynthesisUtterance(EVENT_MESSAGES[pendingType]);
      pendingUtterance.rate = 1;
      pendingUtterance.pitch = 1;
      lastSpokenAtRef.current = Date.now();
      lastSpokenTypeRef.current = pendingType;
      window.speechSynthesis.speak(pendingUtterance);
    };
    if (isCriticalEventType(event.type)) {
      window.speechSynthesis.cancel();
    }
    lastSpokenAtRef.current = now;
    lastSpokenTypeRef.current = event.type;
    window.speechSynthesis.speak(utterance);
  }, []);
  useEffect(() => {
    return () => {
      if (typeof window === "undefined" || window.speechSynthesis === undefined) {
        return;
      }
      window.speechSynthesis.cancel();
    };
  }, []);
  return { speakEvent };
}
