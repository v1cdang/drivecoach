"use client";

import { SignOutButton } from "@/components/sign-out-button";
import { useTripSession } from "@/hooks/use-trip-session";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatSpeedKmh(mps: number | null): string {
  if (mps === null || Number.isNaN(mps)) {
    return "—";
  }
  return `${Math.round(mps * 3.6)} km/h`;
}

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, " ");
}

const LiveTripMap = dynamic(
  async () => (await import("@/components/live-trip-map")).LiveTripMap,
  { ssr: false },
);

/**
 * Primary driving surface: large start/stop controls and live trip stats.
 */
export default function DashboardPage() {
  const {
    isRecording,
    events,
    currentEvent,
    currentSpeedKmh,
    routePoints,
    elapsedMs,
    lastError,
    sessionResult,
    speedLimitKmh,
    startTrip,
    stopTrip,
    clearSessionResult,
    requestSensorAccess,
    currentLatitude,
    currentLongitude,
  } = useTripSession();
  const [stopping, setStopping] = useState(false);
  const onStop = useCallback(async (): Promise<void> => {
    setStopping(true);
    await stopTrip();
    setStopping(false);
  }, [stopTrip]);
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Trip</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Speed threshold: {speedLimitKmh} km/h (set{" "}
            <code className="text-zinc-300">NEXT_PUBLIC_SPEED_LIMIT_KMH</code>)
          </p>
        </div>
        <SignOutButton />
      </div>
      <p className="text-sm text-zinc-500">
        Allow location when prompted. On iOS, tap below once so motion sensors can unlock.
      </p>
      <button
        type="button"
        disabled={isRecording}
        onClick={() => void requestSensorAccess()}
        className="rounded-xl border border-zinc-700 py-4 text-base font-medium text-zinc-200 active:bg-zinc-900 disabled:opacity-40"
      >
        Prepare sensors (location + motion)
      </button>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-center text-sm uppercase tracking-wide text-zinc-500">Duration</p>
        <p className="mt-2 text-center text-5xl font-mono font-semibold text-white">
          {formatElapsed(elapsedMs)}
        </p>
        <p className="mt-4 text-center text-sm text-zinc-400">
          Events this trip: <span className="text-white">{events.length}</span>
        </p>
        {isRecording ? (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Current speed</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {currentSpeedKmh === null ? "—" : `${Math.round(currentSpeedKmh)} km/h`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Last event</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {currentEvent === null ? "—" : formatEventType(currentEvent.type)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
      {isRecording ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-400">Live map</p>
          <LiveTripMap
            routePoints={routePoints}
            currentLatitude={currentLatitude}
            currentLongitude={currentLongitude}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startTrip}
            className="w-full rounded-2xl bg-emerald-600 py-6 text-xl font-semibold text-white shadow-lg shadow-emerald-900/40 active:bg-emerald-500"
          >
            Start Trip
          </button>
        ) : (
          <button
            type="button"
            disabled={stopping}
            onClick={() => void onStop()}
            className="w-full rounded-2xl bg-red-600 py-6 text-xl font-semibold text-white active:bg-red-500 disabled:opacity-60"
          >
            {stopping ? "Saving…" : "Stop Trip"}
          </button>
        )}
      </div>
      {lastError !== null ? <p className="text-center text-sm text-amber-400">{lastError}</p> : null}
      {sessionResult !== null ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold text-white">Last trip summary</h2>
          <p className="mt-2 text-sm text-zinc-300">{sessionResult.summaryText}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-400">
            <div>
              <dt>Time</dt>
              <dd className="font-mono text-white">{formatElapsed(sessionResult.durationMs)}</dd>
            </div>
            <div>
              <dt>Events</dt>
              <dd className="text-white">{sessionResult.stats.eventCount}</dd>
            </div>
            <div>
              <dt>Avg speed</dt>
              <dd className="text-white">{formatSpeedKmh(sessionResult.stats.averageSpeedMps)}</dd>
            </div>
            <div>
              <dt>Trip id</dt>
              <dd className="truncate text-xs text-zinc-500">{sessionResult.tripId || "local only"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-3">
            {sessionResult.tripId !== "" ? (
              <Link
                href={`/trip/${sessionResult.tripId}`}
                className="flex-1 rounded-xl bg-zinc-800 py-3 text-center text-sm font-medium text-white"
              >
                Open details
              </Link>
            ) : null}
            <button
              type="button"
              onClick={clearSessionResult}
              className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm text-zinc-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <Link href="/history" className="text-center text-sm text-emerald-400 underline-offset-2 hover:underline">
        View history
      </Link>
    </div>
  );
}
