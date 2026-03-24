import type { TripEventType } from "@/lib/sensor-types";

const PHRASES: Readonly<Record<TripEventType, readonly string[]>> = {
  speeding: [
    "You're going a bit fast",
    "Ease off the speed",
    "Slow it down slightly",
  ],
  harsh_brake: [
    "Brake more gently",
    "Try braking a bit earlier",
    "That was a bit hard on the brakes",
  ],
  rapid_acceleration: [
    "Ease into the throttle",
    "Accelerate more smoothly",
    "Take it easy on the gas",
  ],
};

/**
 * Picks a coaching line for the event type, avoiding an immediate repeat of the same wording.
 */
export function pickCoachingPhrase(eventType: TripEventType, excludeMessage: string | null): string {
  const list = PHRASES[eventType];
  const candidates =
    excludeMessage === null ? [...list] : list.filter((phrase) => phrase !== excludeMessage);
  const pool = candidates.length > 0 ? candidates : [...list];
  return pool[Math.floor(Math.random() * pool.length)]!;
}
