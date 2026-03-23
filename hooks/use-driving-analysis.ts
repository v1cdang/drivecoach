"use client";

import { drivingConfig } from "@/lib/driving-config";
import type { SensorData, TripEvent } from "@/lib/sensor-types";
import { useEffect, useMemo, useState } from "react";

type AnalysisConfig = {
  readonly speedLimitKmh: number;
  readonly harshBrakeMps2: number;
  readonly rapidAccelerationMps2: number;
  readonly accelFallbackMps2: number;
  readonly maxEvents: number;
};

type AnalysisState = {
  readonly currentEvent: TripEvent | null;
  readonly events: readonly TripEvent[];
};

const MS_IN_SECOND = 1000;
const KMH_TO_MPS = 3.6;

function buildDefaultConfig(): AnalysisConfig {
  return {
    speedLimitKmh: drivingConfig.speedLimitKmh,
    harshBrakeMps2: 2.2,
    rapidAccelerationMps2: 2.2,
    accelFallbackMps2: 3.8,
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
 * Performs lightweight real-time analysis from sampled sensor data.
 */
export function useDrivingAnalysis(
  sensorData: SensorData | null,
  isTripActive: boolean,
  customConfig?: Partial<AnalysisConfig>,
): AnalysisState {
  const [events, setEvents] = useState<readonly TripEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<TripEvent | null>(null);
  const [previousSensorData, setPreviousSensorData] = useState<SensorData | null>(null);
  const config = useMemo(
    (): AnalysisConfig => ({ ...buildDefaultConfig(), ...customConfig }),
    [customConfig],
  );
  useEffect(() => {
    if (!isTripActive) {
      setEvents([]);
      setCurrentEvent(null);
      setPreviousSensorData(null);
      return;
    }
    if (sensorData === null) {
      return;
    }
    let nextEvent: TripEvent | null = null;
    if (sensorData.speed !== null && sensorData.speed > config.speedLimitKmh) {
      nextEvent = createDrivingEvent("speeding", sensorData.speed, sensorData.timestamp);
    }
    if (previousSensorData !== null && previousSensorData.speed !== null && sensorData.speed !== null) {
      const deltaSeconds = Math.max(
        (sensorData.timestamp - previousSensorData.timestamp) / MS_IN_SECOND,
        0.1,
      );
      const deltaMps2 = (sensorData.speed / KMH_TO_MPS - previousSensorData.speed / KMH_TO_MPS) / deltaSeconds;
      if (deltaMps2 <= -config.harshBrakeMps2) {
        nextEvent = createDrivingEvent("harsh_brake", Math.abs(deltaMps2), sensorData.timestamp);
      } else if (deltaMps2 >= config.rapidAccelerationMps2) {
        nextEvent = createDrivingEvent("rapid_acceleration", deltaMps2, sensorData.timestamp);
      }
    }
    if (nextEvent === null) {
      const dominantAxisValue = pickDominantAxisValue(sensorData.acceleration);
      if (dominantAxisValue !== null && dominantAxisValue <= -config.accelFallbackMps2) {
        nextEvent = createDrivingEvent("harsh_brake", Math.abs(dominantAxisValue), sensorData.timestamp);
      } else if (dominantAxisValue !== null && dominantAxisValue >= config.accelFallbackMps2) {
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
    setPreviousSensorData(sensorData);
  }, [config, isTripActive, previousSensorData, sensorData]);
  return { currentEvent, events };
}
