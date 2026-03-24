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
        <div className="flex min-h-[calc(100dvh-8rem)] flex-1 flex-col rounded-2xl border border-[#dce6f7] bg-[#f5f9ff] px-4 py-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-xs text-[rgb(39_58_86)]">{formatElapsed(elapsedMs)}</p>
            <SignOutButton />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-7xl font-bold tabular-nums leading-none tracking-tight text-[#0b2f6b] sm:text-8xl">
              {speedDisplay}
              <span className="block text-2xl font-semibold text-[rgb(39_58_86)] sm:text-3xl">km/h</span>
            </p>
            <p className="mt-2 text-lg text-[rgb(39_58_86)]">
              Limit: <span className="text-[#0b2f6b]">{speedLimitKmh}</span> km/h
            </p>
            <p className="mt-8 min-h-[3.5rem] max-w-sm text-lg font-medium leading-snug text-[rgb(39_58_86)]">
              {lastCoachingMessage !== null ? (
                <span className="text-[#1d447e]">&ldquo;{lastCoachingMessage}&rdquo;</span>
              ) : (
                <span className="text-[#7f9bc2]">Tips appear when something stands out</span>
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={stopping}
            onClick={() => void onStop()}
            className="mt-auto min-h-14 w-full rounded-2xl bg-[#0b2f6b] py-5 text-lg font-semibold text-white active:bg-[#0a285a] disabled:opacity-60"
          >
            {stopping ? "Saving…" : "Stop Trip"}
          </button>
          <p className="mt-3 text-center text-xs text-[#7f9bc2]">Events this trip: {events.length}</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#0b2f6b]">Trip</h1>
              <p className="mt-1 text-sm text-[rgb(39_58_86)]">
                Limit {speedLimitKmh} km/h —
              </p>
            </div>
            <SignOutButton />
          </div>
          <p className="text-sm text-[rgb(39_58_86)]">
            Allow location when prompted. On iOS, tap below once so motion sensors can unlock.
          </p>
          <button
            type="button"
            disabled={isRecording}
            onClick={() => void requestSensorAccess()}
            className="min-h-12 rounded-xl border border-[#bfd2ed] bg-white py-4 text-base font-medium text-[#1d447e] active:bg-[#eef5ff] disabled:opacity-40"
          >
            Prepare sensors (location + motion)
          </button>
          <div className="rounded-2xl border border-[#dce6f7] bg-[#f5f9ff] p-6">
            <p className="text-center text-sm uppercase tracking-wide text-[rgb(39_58_86)]">Last trip duration</p>
            <p className="mt-2 text-center text-5xl font-mono font-semibold text-[#0b2f6b]">{formatElapsed(elapsedMs)}</p>
          </div>
          <button
            type="button"
            onClick={startTrip}
            className="min-h-14 w-full rounded-2xl bg-[#10d4c5] py-6 text-xl font-semibold text-[#05244f] shadow-lg shadow-[#10d4c5]/35 active:bg-[#0bc4b6]"
          >
            Start Trip
          </button>
        </>
      )}
      {lastError !== null ? <p className="text-center text-sm text-amber-400">{lastError}</p> : null}
      {sessionResult !== null ? (
        <div className="rounded-2xl border border-[#dce6f7] bg-[#f5f9ff] p-4">
          <h2 className="text-lg font-semibold text-[#0b2f6b]">Last trip summary</h2>
          <p className="mt-2 text-sm text-[#365f98]">{sessionResult.summaryText}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-[rgb(39_58_86)]">
            <div>
              <dt>Time</dt>
              <dd className="font-mono text-[#0b2f6b]">{formatElapsed(sessionResult.durationMs)}</dd>
            </div>
            <div>
              <dt>Events</dt>
              <dd className="text-[#0b2f6b]">{sessionResult.stats.eventCount}</dd>
            </div>
            <div>
              <dt>Avg speed</dt>
              <dd className="text-[#0b2f6b]">{formatSpeedKmh(sessionResult.stats.averageSpeedMps)}</dd>
            </div>
            <div>
              <dt>Trip id</dt>
              <dd className="truncate text-xs text-[rgb(39_58_86)]">{sessionResult.tripId || "local only"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-3">
            {sessionResult.tripId !== "" ? (
              <Link
                href={`/trip/${sessionResult.tripId}`}
                className="flex-1 rounded-xl bg-[#0b2f6b] py-3 text-center text-sm font-medium text-white"
              >
                Open details
              </Link>
            ) : null}
            <button
              type="button"
              onClick={clearSessionResult}
              className="flex-1 rounded-xl border border-[#b9cde9] py-3 text-sm text-[#3d6296]"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <Link href="/history" className="text-center text-sm text-[#00b9ac] underline-offset-2 hover:underline">
        View history
      </Link>
    </div>
  );
}
