import { drivingConfig } from "@/lib/driving-config";
import type { SensorSample, TripEvent } from "@/lib/sensor-types";

function magnitude3(x: number | null, y: number | null, z: number | null): number | null {
  if (x === null || y === null || z === null) {
    return null;
  }
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Compares the latest sample to the previous one and emits at most one primary event
 * (priority: harsh brake > fast accel > speeding) to reduce duplicate voice cues.
 */
export function detectTripEventFromSamples(
  previous: SensorSample | null,
  current: SensorSample,
): TripEvent | null {
  const limitMps = drivingConfig.speedLimitMps;
  const dtSeconds = drivingConfig.sampleIntervalMs / 1000;
  const prevSpeed = previous?.speedMps ?? null;
  const currSpeed = current.speedMps;
  if (previous !== null && prevSpeed !== null && currSpeed !== null && dtSeconds > 0) {
    const delta = (currSpeed - prevSpeed) / dtSeconds;
    if (delta <= -drivingConfig.harshBrakeSpeedDropMps) {
      return {
        type: "harsh_brake",
        timestamp: current.timestamp,
        value: Math.abs(delta),
      };
    }
    if (delta >= drivingConfig.fastAccelSpeedGainMps) {
      return {
        type: "fast_acceleration",
        timestamp: current.timestamp,
        value: delta,
      };
    }
  }
  const impulse = magnitude3(
    current.accelerationX,
    current.accelerationY,
    current.accelerationZ,
  );
  if (
    prevSpeed === null &&
    currSpeed === null &&
    impulse !== null &&
    impulse >= drivingConfig.harshAccelImpulseMps2
  ) {
    const prevImpulse = magnitude3(
      previous?.accelerationX ?? null,
      previous?.accelerationY ?? null,
      previous?.accelerationZ ?? null,
    );
    if (previous === null || prevImpulse === null || impulse > prevImpulse + 4) {
      return {
        type: "fast_acceleration",
        timestamp: current.timestamp,
        value: impulse,
      };
    }
  }
  if (currSpeed !== null && currSpeed > limitMps) {
    return {
      type: "speeding",
      timestamp: current.timestamp,
      value: currSpeed,
    };
  }
  return null;
}

/** Counts sharp yaw spikes from gyro (for rule-based summary only). */
export function isSharpTurnSample(sample: SensorSample): boolean {
  const g = sample.rotationGamma;
  if (g === null) {
    return false;
  }
  return Math.abs(g) >= drivingConfig.sharpTurnRotationDps;
}
