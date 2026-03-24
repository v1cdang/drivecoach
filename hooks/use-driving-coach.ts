"use client";

import { useDrivingAnalysis } from "@/hooks/use-driving-analysis";
import { useSensorData } from "@/hooks/use-sensor-data";
import { useVoiceCoach } from "@/hooks/use-voice-coach";
import type { SensorData, TripEvent } from "@/lib/sensor-types";
import { useEffect, useMemo, useRef } from "react";

type DrivingCoachState = {
  readonly speed: number | null;
  readonly currentEvent: TripEvent | null;
  readonly events: readonly TripEvent[];
  readonly sensorError: string | null;
  readonly requestSensorAccess: () => Promise<void>;
  readonly lastCoachingMessage: string | null;
};

/**
 * Composes sensor sampling, event analysis, and voice feedback for active trips.
 */
export function useDrivingCoach(isTripActive: boolean): DrivingCoachState {
  const { speed, latitude, longitude, acceleration, timestamp, sensorError, requestSensorAccess } =
    useSensorData(isTripActive);
  const sensorData = useMemo((): SensorData | null => {
    if (!isTripActive) {
      return null;
    }
    return { speed, latitude, longitude, acceleration, timestamp };
  }, [acceleration, isTripActive, latitude, longitude, speed, timestamp]);
  const { currentEvent, events } = useDrivingAnalysis(sensorData, isTripActive);
  const { speakEvent, lastCoachingMessage } = useVoiceCoach(isTripActive);
  const lastAnnouncedEventRef = useRef<number | null>(null);
  useEffect(() => {
    if (currentEvent === null) {
      return;
    }
    if (lastAnnouncedEventRef.current === currentEvent.timestamp) {
      return;
    }
    lastAnnouncedEventRef.current = currentEvent.timestamp;
    speakEvent(currentEvent);
  }, [currentEvent, speakEvent]);
  useEffect(() => {
    if (!isTripActive) {
      lastAnnouncedEventRef.current = null;
    }
  }, [isTripActive]);
  return {
    speed,
    currentEvent,
    events,
    sensorError,
    requestSensorAccess,
    lastCoachingMessage,
  };
}
