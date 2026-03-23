import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type TripRow = {
  readonly id: string;
  readonly started_at: string;
  readonly duration_seconds: number;
  readonly event_count: number;
  readonly average_speed_mps: number | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Lists past trips for the signed-in user (newest first).
 */
export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/login");
  }
  const { data, error } = await supabase
    .from("trips")
    .select("id, started_at, duration_seconds, event_count, average_speed_mps")
    .order("started_at", { ascending: false })
    .limit(50);
  const trips = (data ?? []) as TripRow[];
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">History</h1>
      {error !== null ? (
        <p className="text-sm text-red-400">{error.message}</p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-zinc-400">No trips yet. Start one from the dashboard.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trip/${trip.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 active:border-zinc-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{formatDate(trip.started_at)}</span>
                  <span className="text-xs text-zinc-500">{trip.duration_seconds}s</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {trip.event_count} events
                  {trip.average_speed_mps !== null
                    ? ` · avg ${Math.round(trip.average_speed_mps * 3.6)} km/h`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
