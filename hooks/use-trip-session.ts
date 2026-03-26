"use client";

import { useDrivingCoach } from "@/hooks/use-driving-coach";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { drivingConfig } from "@/lib/driving-config";
import { primeSpeechSynthesisFromUserGesture } from "@/lib/prime-speech-synthesis";
import type { TripEvent } from "@/lib/sensor-types";
import { buildTripSummary, countTripEventsByType, type TripSummaryStats } from "@/lib/trip-summary";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type TripSessionResult = {
  readonly durationMs: number;
  readonly summaryText: string;
  readonly stats: TripSummaryStats;
  readonly tripId: string;
};

/**
 * Owns an in-memory trip: ties sensor sampling to event detection, voice feedback,
 * elapsed time, and Supabase persistence on stop.
 */
export function useTripSession(): {
  readonly isRecording: boolean;
  readonly events: readonly TripEvent[];
  readonly currentEvent: TripEvent | null;
  readonly currentSpeedKmh: number | null;
  readonly elapsedMs: number;
  readonly lastError: string | null;
  readonly sessionResult: TripSessionResult | null;
  readonly speedLimitKmh: number;
  readonly lastCoachingMessage: string | null;
  readonly startTrip: () => void;
  readonly stopTrip: () => Promise<TripSessionResult | null>;
  readonly clearSessionResult: () => void;
  readonly requestSensorAccess: () => Promise<void>;
} {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionResult, setSessionResult] = useState<TripSessionResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const speedAggRef = useRef<{ sum: number; n: number }>({ sum: 0, n: 0 });
  const startedAtRef = useRef<number | null>(null);
  const speedLimitKmh = useMemo(() => drivingConfig.speedLimitKmh, []);
  const {
    speed: currentSpeedKmh,
    currentEvent,
    events: coachEvents,
    sensorError,
    requestSensorAccess,
    lastCoachingMessage,
  } = useDrivingCoach(isRecording);
  const eventsSnapshotRef = useRef<readonly TripEvent[]>([]);
  useLayoutEffect(() => {
    eventsSnapshotRef.current = coachEvents;
  }, [coachEvents]);
  useEffect(() => {
    if (!isRecording) {
      return;
    }
    if (currentSpeedKmh === null || currentSpeedKmh <= 0) {
      return;
    }
    speedAggRef.current = {
      sum: speedAggRef.current.sum + currentSpeedKmh / 3.6,
      n: speedAggRef.current.n + 1,
    };
  }, [currentSpeedKmh, isRecording]);
  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }
    const id = window.setInterval(() => {
      const start = startedAtRef.current;
      if (start === null) {
        return;
      }
      setElapsedMs(Date.now() - start);
    }, 500);
    return () => window.clearInterval(id);
  }, [isRecording]);
  const startTrip = useCallback((): void => {
    primeSpeechSynthesisFromUserGesture();
    speedAggRef.current = { sum: 0, n: 0 };
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setSessionResult(null);
    setLastError(null);
    setIsRecording(true);
  }, []);
  const stopTrip = useCallback(async (): Promise<TripSessionResult | null> => {
    setIsRecording(false);
    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    if (startedAt === null) {
      return null;
    }
    const endedAt = Date.now();
    const durationMs = endedAt - startedAt;
    const eventList = eventsSnapshotRef.current;
    const counts = countTripEventsByType(eventList);
    const { sum, n } = speedAggRef.current;
    const averageSpeedMps = n > 0 ? sum / n : null;
    const stats: TripSummaryStats = {
      durationMs,
      averageSpeedMps,
      sharpTurnSamples: 0,
      ...counts,
    };
    const summaryText = buildTripSummary(stats);
    setLastError(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError !== null || user === null) {
      setLastError(userError?.message ?? "Not signed in");
      const local: TripSessionResult = {
        durationMs,
        summaryText,
        stats,
        tripId: "",
      };
      setSessionResult(local);
      return local;
    }
    const { error: ensureUserError } = await supabase.from("users").upsert(
      { id: user.id, email: user.email ?? null },
      { onConflict: "id" },
    );
    if (ensureUserError !== null) {
      setLastError(ensureUserError.message);
      const local: TripSessionResult = {
        durationMs,
        summaryText,
        stats,
        tripId: "",
      };
      setSessionResult(local);
      return local;
    }
    const { data: tripRow, error: tripError } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        started_at: new Date(startedAt).toISOString(),
        ended_at: new Date(endedAt).toISOString(),
        duration_seconds: Math.max(1, Math.round(durationMs / 1000)),
        event_count: eventList.length,
        average_speed_mps: averageSpeedMps,
        summary_text: summaryText,
      })
      .select("id")
      .single();
    if (tripError !== null || tripRow === null) {
      setLastError(tripError?.message ?? "Failed to save trip");
      const local: TripSessionResult = {
        durationMs,
        summaryText,
        stats,
        tripId: "",
      };
      setSessionResult(local);
      return local;
    }
    const tripId = tripRow.id as string;
    if (eventList.length > 0) {
      const rows = eventList.map((e) => ({
        trip_id: tripId,
        type: e.type,
        occurred_at_ms: e.timestamp,
        value: e.value,
      }));
      const { error: evError } = await supabase.from("trip_events").insert(rows);
      if (evError !== null) {
        setLastError(evError.message);
      }
    }
    const result: TripSessionResult = {
      durationMs,
      summaryText,
      stats,
      tripId,
    };
    setSessionResult(result);
    return result;
  }, [supabase]);
  const clearSessionResult = useCallback((): void => {
    setSessionResult(null);
  }, []);
  return {
    isRecording,
    events: coachEvents,
    currentEvent,
    currentSpeedKmh,
    elapsedMs,
    lastError: sensorError ?? lastError,
    sessionResult,
    speedLimitKmh,
    lastCoachingMessage,
    startTrip,
    stopTrip,
    clearSessionResult,
    requestSensorAccess,
  };
}
