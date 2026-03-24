"use client";

import { pickCoachingPhrase } from "@/lib/coaching-phrases";
import type { TripEvent, TripEventType } from "@/lib/sensor-types";
import { useCallback, useEffect, useRef, useState } from "react";

const COOLDOWN_MIN_MS = 5000;
const COOLDOWN_MAX_MS = 8000;

function randomCooldownMs(): number {
  return (
    COOLDOWN_MIN_MS + Math.floor(Math.random() * (COOLDOWN_MAX_MS - COOLDOWN_MIN_MS + 1))
  );
}

function getEventPriority(eventType: TripEventType): number {
  if (eventType === "speeding") {
    return 3;
  }
  if (eventType === "harsh_brake") {
    return 2;
  }
  return 1;
}

function shouldRandomlySkipFeedback(eventType: TripEventType): boolean {
  const roll = Math.random();
  if (eventType === "speeding") {
    return roll < 0.05;
  }
  if (eventType === "harsh_brake") {
    return roll < 0.1;
  }
  return roll < 0.15;
}

/**
 * Web Speech API coaching with cooldowns, priority interrupts, and phrase variation (no overlap spam).
 */
export function useVoiceCoach(isTripActive: boolean): {
  readonly speakEvent: (event: TripEvent) => void;
  readonly lastCoachingMessage: string | null;
} {
  const lastSpokenAtRef = useRef<number>(0);
  const nextAllowedSpeakAtRef = useRef<number>(0);
  const lastSpokenPriorityRef = useRef<number>(0);
  const speakingPriorityRef = useRef<number | null>(null);
  const lastPhraseRef = useRef<string | null>(null);
  const [lastCoachingMessage, setLastCoachingMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!isTripActive) {
      return;
    }
    if (typeof window !== "undefined" && window.speechSynthesis !== undefined) {
      window.speechSynthesis.cancel();
    }
    speakingPriorityRef.current = null;
    setLastCoachingMessage(null);
    lastPhraseRef.current = null;
    nextAllowedSpeakAtRef.current = 0;
    lastSpokenPriorityRef.current = 0;
  }, [isTripActive]);
  const speakEvent = useCallback((event: TripEvent): void => {
    if (typeof window === "undefined" || window.speechSynthesis === undefined) {
      return;
    }
    if (shouldRandomlySkipFeedback(event.type)) {
      return;
    }
    const priority = getEventPriority(event.type);
    const now = Date.now();
    if (window.speechSynthesis.speaking && speakingPriorityRef.current !== null) {
      if (priority <= speakingPriorityRef.current) {
        return;
      }
      window.speechSynthesis.cancel();
      speakingPriorityRef.current = null;
    }
    if (now < nextAllowedSpeakAtRef.current && priority <= lastSpokenPriorityRef.current) {
      return;
    }
    const phrase = pickCoachingPhrase(event.type, lastPhraseRef.current);
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = (): void => {
      speakingPriorityRef.current = priority;
    };
    utterance.onend = (): void => {
      speakingPriorityRef.current = null;
    };
    utterance.onerror = (): void => {
      speakingPriorityRef.current = null;
    };
    lastSpokenAtRef.current = now;
    nextAllowedSpeakAtRef.current = now + randomCooldownMs();
    lastSpokenPriorityRef.current = priority;
    lastPhraseRef.current = phrase;
    setLastCoachingMessage(phrase);
    window.speechSynthesis.speak(utterance);
  }, []);
  useEffect(() => {
    return (): void => {
      if (typeof window === "undefined" || window.speechSynthesis === undefined) {
        return;
      }
      window.speechSynthesis.cancel();
    };
  }, []);
  return { speakEvent, lastCoachingMessage };
}
