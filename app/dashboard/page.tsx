"use client";

import { SignOutButton } from "@/components/sign-out-button";
import { useTripSession } from "@/hooks/use-trip-session";
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

/**
 * Primary driving surface: speed-first layout while recording; setup and summary when idle.
 */
export default function DashboardPage() {
  const {
    isRecording,
    events,
    currentSpeedKmh,
    elapsedMs,
    lastError,
    sessionResult,
    speedLimitKmh,
    lastCoachingMessage,
    startTrip,
    stopTrip,
    clearSessionResult,
    requestSensorAccess,
  } = useTripSession();
  const [stopping, setStopping] = useState(false);
  const onStop = useCallback(async (): Promise<void> => {
    setStopping(true);
    await stopTrip();
    setStopping(false);
  }, [stopTrip]);
  const speedDisplay =
    currentSpeedKmh === null || Number.isNaN(currentSpeedKmh) ? "—" : `${Math.round(currentSpeedKmh)}`;
  return (
    <div className="flex flex-1 flex-col gap-6">
      {isRecording ? (
        <div className="flex min-h-[calc(100dvh-8rem)] flex-1 flex-col rounded-2xl bg-zinc-950 px-4 py-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-xs text-zinc-500">{formatElapsed(elapsedMs)}</p>
            <SignOutButton />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-7xl font-bold tabular-nums leading-none tracking-tight text-white sm:text-8xl">
              {speedDisplay}
              <span className="block text-2xl font-semibold text-zinc-400 sm:text-3xl">km/h</span>
            </p>
            <p className="mt-2 text-lg text-zinc-400">
              Limit: <span className="text-zinc-200">{speedLimitKmh}</span> km/h
            </p>
            <p className="mt-8 min-h-[3.5rem] max-w-sm text-lg font-medium leading-snug text-zinc-500">
              {lastCoachingMessage !== null ? (
                <span className="text-zinc-300">&ldquo;{lastCoachingMessage}&rdquo;</span>
              ) : (
                <span className="text-zinc-600">Tips appear when something stands out</span>
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={stopping}
            onClick={() => void onStop()}
            className="mt-auto min-h-14 w-full rounded-2xl bg-red-600 py-5 text-lg font-semibold text-white active:bg-red-500 disabled:opacity-60"
          >
            {stopping ? "Saving…" : "Stop Trip"}
          </button>
          <p className="mt-3 text-center text-xs text-zinc-600">Events this trip: {events.length}</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Trip</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Limit {speedLimitKmh} km/h — set <code className="text-zinc-300">NEXT_PUBLIC_SPEED_LIMIT_KMH</code>
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
            className="min-h-12 rounded-xl border border-zinc-700 py-4 text-base font-medium text-zinc-200 active:bg-zinc-900 disabled:opacity-40"
          >
            Prepare sensors (location + motion)
          </button>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-center text-sm uppercase tracking-wide text-zinc-500">Last trip duration</p>
            <p className="mt-2 text-center text-5xl font-mono font-semibold text-white">{formatElapsed(elapsedMs)}</p>
          </div>
          <button
            type="button"
            onClick={startTrip}
            className="min-h-14 w-full rounded-2xl bg-emerald-600 py-6 text-xl font-semibold text-white shadow-lg shadow-emerald-900/40 active:bg-emerald-500"
          >
            Start Trip
          </button>
        </>
      )}
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
