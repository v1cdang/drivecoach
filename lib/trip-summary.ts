import type { TripEvent } from "@/lib/sensor-types";

export type TripSummaryStats = {
  readonly durationMs: number;
  readonly eventCount: number;
  readonly averageSpeedMps: number | null;
  readonly harshBrakeCount: number;
  readonly fastAccelCount: number;
  readonly speedingCount: number;
  readonly sharpTurnSamples: number;
};

/**
 * Aggregates counters and a simple deterministic "coach" paragraph from trip data.
 * Replace with model-based copy later without changing storage shape.
 */
export function buildTripSummary(stats: TripSummaryStats): string {
  const parts: string[] = [];
  if (stats.harshBrakeCount > stats.fastAccelCount + 1) {
    parts.push("You tend to brake late and harshly; anticipate stops earlier.");
  } else if (stats.fastAccelCount > stats.harshBrakeCount + 1) {
    parts.push("You often accelerate aggressively after slowing down; smooth inputs save fuel and stress.");
  } else {
    parts.push("Your braking and acceleration balance looks fairly even for this trip.");
  }
  if (stats.speedingCount > 0) {
    parts.push(`You exceeded your speed threshold ${stats.speedingCount} time(s).`);
  } else {
    parts.push("You stayed within your configured speed limit.");
  }
  if (stats.sharpTurnSamples > 8) {
    parts.push("Gyro data suggests several sharp steering corrections; wider turns feel smoother.");
  }
  if (stats.eventCount === 0) {
    return "Clean run: no harsh events were recorded. Keep scanning ahead and maintaining smooth inputs.";
  }
  return parts.join(" ");
}

export function countTripEventsByType(events: readonly TripEvent[]): {
  readonly eventCount: number;
  readonly harshBrakeCount: number;
  readonly fastAccelCount: number;
  readonly speedingCount: number;
} {
  let harshBrakeCount = 0;
  let fastAccelCount = 0;
  let speedingCount = 0;
  for (const event of events) {
    if (event.type === "harsh_brake") {
      harshBrakeCount += 1;
    } else if (event.type === "fast_acceleration") {
      fastAccelCount += 1;
    } else if (event.type === "speeding") {
      speedingCount += 1;
    }
  }
  return {
    eventCount: events.length,
    harshBrakeCount,
    fastAccelCount,
    speedingCount,
  };
}
