import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type TripRow = {
  readonly id: string;
  readonly started_at: string;
  readonly ended_at: string;
  readonly duration_seconds: number;
  readonly event_count: number;
  readonly average_speed_mps: number | null;
  readonly summary_text: string | null;
};

type TripEventRow = {
  readonly type: string;
  readonly occurred_at_ms: number;
  readonly value: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type PageProps = { readonly params: Promise<{ readonly id: string }> };

/** Per-request rendering; trip is user-specific and must not be statically baked at build time. */
export const dynamic = "force-dynamic";

/**
 * Trip detail with stored summary and per-event rows from Supabase.
 */
export default async function TripDetailPage(props: PageProps) {
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/login");
  }
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, started_at, ended_at, duration_seconds, event_count, average_speed_mps, summary_text")
    .eq("id", id)
    .maybeSingle();
  if (tripError !== null || trip === null) {
    notFound();
  }
  const tripRow = trip as TripRow;
  const { data: evs } = await supabase
    .from("trip_events")
    .select("type, occurred_at_ms, value")
    .eq("trip_id", id)
    .order("occurred_at_ms", { ascending: true });
  const events = (evs ?? []) as TripEventRow[];
  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link href="/history" className="text-sm text-[#00b9ac] hover:underline">
        ← Back to history
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-[#0b2f6b]">Trip</h1>
        <p className="mt-1 text-sm text-[rgb(39_58_86)]">
          {formatDate(tripRow.started_at)} — {formatDate(tripRow.ended_at)}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-[#dce6f7] bg-[#f5f9ff] p-4 text-sm">
        <div>
          <dt className="text-[rgb(39_58_86)]">Duration</dt>
          <dd className="font-mono text-[#0b2f6b]">{tripRow.duration_seconds}s</dd>
        </div>
        <div>
          <dt className="text-[rgb(39_58_86)]">Events</dt>
          <dd className="text-[#0b2f6b]">{tripRow.event_count}</dd>
        </div>
        <div>
          <dt className="text-[rgb(39_58_86)]">Avg speed</dt>
          <dd className="text-[#0b2f6b]">
            {tripRow.average_speed_mps !== null
              ? `${Math.round(tripRow.average_speed_mps * 3.6)} km/h`
              : "—"}
          </dd>
        </div>
      </dl>
      <section>
        <h2 className="text-lg font-medium text-[#0b2f6b]">Coach summary</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#365f98]">
          {tripRow.summary_text ?? "No summary stored for this trip."}
        </p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-[#0b2f6b]">Events</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-[rgb(39_58_86)]">No events recorded.</p>
        ) : (
          <ul className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
            {events.map((e, i) => (
              <li
                key={`${e.occurred_at_ms}-${i}`}
                className="rounded-xl border border-[#dce6f7] bg-white px-3 py-2 text-xs text-[#365f98]"
              >
                <span className="font-medium text-[#0b2f6b]">{e.type.replace(/_/g, " ")}</span>
                <span className="ml-2 text-[rgb(39_58_86)]">value {e.value.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
