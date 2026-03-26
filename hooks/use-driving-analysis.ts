"use client";

import { drivingConfig } from "@/lib/driving-config";
import type { SensorData, TripEvent } from "@/lib/sensor-types";
import { useEffect, useMemo, useRef, useState } from "react";

type AnalysisConfig = {
  readonly speedLimitKmh: number;
  readonly harshBrakeMinAvgAbsMps2: number;
  readonly rapidMinAvgAccelerationMps2: number;
  readonly accelRollingWindowMs: number;
  readonly accelMinWindowMs: number;
  readonly accelFallbackMps2: number;
  readonly lowSpeedAccelSuppressKmh: number;
  readonly maxEvents: number;
};

type AnalysisState = {
  readonly currentEvent: TripEvent | null;
  readonly events: readonly TripEvent[];
};

const MS_IN_SECOND = 1000;
const KMH_TO_MPS = 3.6;

type SpeedSample = {
  readonly t: number;
  readonly speedKmh: number | null;
};

function buildDefaultConfig(): AnalysisConfig {
  return {
    speedLimitKmh: drivingConfig.speedLimitKmh,
    harshBrakeMinAvgAbsMps2: drivingConfig.harshBrakeMinAvgAbsMps2,
    rapidMinAvgAccelerationMps2: drivingConfig.rapidMinAvgAccelerationMps2,
    accelRollingWindowMs: drivingConfig.accelerationRollingWindowMs,
    accelMinWindowMs: drivingConfig.accelerationMinWindowMs,
    accelFallbackMps2: drivingConfig.accelFallbackMps2,
    lowSpeedAccelSuppressKmh: drivingConfig.lowSpeedAccelSuppressKmh,
    maxEvents: 160,
  };
}

function createDrivingEvent(type: TripEvent["type"], value: number, timestamp: number): TripEvent {
  return { type, value, timestamp };
}

function pickDominantAxisValue(acceleration: SensorData["acceleration"]): number | null {
  if (acceleration === null) {
    return null;
  }
  const axes = [acceleration.x, acceleration.y, acceleration.z];
  let dominant = axes[0];
  for (const value of axes) {
    if (Math.abs(value) > Math.abs(dominant)) {
      dominant = value;
    }
  }
  return dominant;
}

/**
 * Mean longitudinal acceleration (m/s²) from first GPS speed in the rolling window to the latest sample.
 */
function computeRollingLongitudinalAccelMps2(
  samples: readonly SpeedSample[],
  windowMs: number,
  minWindowMs: number,
): number | null {
  if (samples.length < 2) {
    return null;
  }
  const last = samples[samples.length - 1];
  if (last.speedKmh === null) {
    return null;
  }
  const windowStart = last.t - windowMs;
  const firstInWindow = samples.find((s) => s.t >= windowStart && s.speedKmh !== null);
  if (firstInWindow === undefined || firstInWindow.speedKmh === null) {
    return null;
  }
  const dtMs = last.t - firstInWindow.t;
  if (dtMs < minWindowMs) {
    return null;
  }
  const lastMps = last.speedKmh / KMH_TO_MPS;
  const firstMps = firstInWindow.speedKmh / KMH_TO_MPS;
  const dtSeconds = dtMs / MS_IN_SECOND;
  return (lastMps - firstMps) / dtSeconds;
}

function pruneSpeedHistory(samples: SpeedSample[], nowMs: number, windowMs: number): void {
  const cutoff = nowMs - windowMs - MS_IN_SECOND;
  while (samples.length > 0 && samples[0].t < cutoff) {
    samples.shift();
  }
}

/**
 * Performs lightweight real-time analysis from sampled sensor data.
 */
export function useDrivingAnalysis(
  sensorData: SensorData | null,
  isTripActive: boolean,
  customConfig?: Partial<AnalysisConfig>,
): AnalysisState {
  const [events, setEvents] = useState<readonly TripEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<TripEvent | null>(null);
  const speedHistoryRef = useRef<SpeedSample[]>([]);
  const config = useMemo(
    (): AnalysisConfig => ({ ...buildDefaultConfig(), ...customConfig }),
    [customConfig],
  );
  useEffect(() => {
    if (!isTripActive) {
      speedHistoryRef.current = [];
      setEvents([]);
      setCurrentEvent(null);
      return;
    }
    if (sensorData === null) {
      return;
    }
    speedHistoryRef.current.push({ t: sensorData.timestamp, speedKmh: sensorData.speed });
    pruneSpeedHistory(speedHistoryRef.current, sensorData.timestamp, config.accelRollingWindowMs);
    let nextEvent: TripEvent | null = null;
    if (sensorData.speed !== null && sensorData.speed > config.speedLimitKmh) {
      nextEvent = createDrivingEvent("speeding", sensorData.speed, sensorData.timestamp);
    }
    if (nextEvent === null) {
      const avgLong = computeRollingLongitudinalAccelMps2(
        speedHistoryRef.current,
        config.accelRollingWindowMs,
        config.accelMinWindowMs,
      );
      if (avgLong !== null) {
        if (avgLong <= -config.harshBrakeMinAvgAbsMps2) {
          nextEvent = createDrivingEvent("harsh_brake", Math.abs(avgLong), sensorData.timestamp);
        } else if (avgLong >= config.rapidMinAvgAccelerationMps2) {
          nextEvent = createDrivingEvent("rapid_acceleration", avgLong, sensorData.timestamp);
        }
      }
    }
    if (nextEvent === null) {
      const dominantAxisValue = pickDominantAxisValue(sensorData.acceleration);
      const speedKmh = sensorData.speed;
      const allowAccelRapid =
        speedKmh === null || speedKmh >= config.lowSpeedAccelSuppressKmh;
      if (dominantAxisValue !== null && dominantAxisValue <= -config.accelFallbackMps2) {
        nextEvent = createDrivingEvent("harsh_brake", Math.abs(dominantAxisValue), sensorData.timestamp);
      } else if (
        allowAccelRapid &&
        dominantAxisValue !== null &&
        dominantAxisValue >= config.accelFallbackMps2
      ) {
        nextEvent = createDrivingEvent("rapid_acceleration", dominantAxisValue, sensorData.timestamp);
      }
    }
    if (nextEvent !== null) {
      setCurrentEvent(nextEvent);
      setEvents((previousEvents) => {
        const nextEvents = [...previousEvents, nextEvent];
        return nextEvents.length > config.maxEvents ? nextEvents.slice(-config.maxEvents) : nextEvents;
      });
    }
  }, [config, isTripActive, sensorData]);
  return { currentEvent, events };
}
