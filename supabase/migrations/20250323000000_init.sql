-- DriveCoach schema: profiles, trips, trip_events with RLS.

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users_select_own" on public.users for select using (auth.uid() = id);

create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users for update using (auth.uid() = id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  event_count integer not null default 0,
  average_speed_mps real,
  summary_text text,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "trips_select_own" on public.trips for select using (auth.uid() = user_id);

create policy "trips_insert_own" on public.trips for insert with check (auth.uid() = user_id);

create policy "trips_update_own" on public.trips for update using (auth.uid() = user_id);

create policy "trips_delete_own" on public.trips for delete using (auth.uid() = user_id);

create table public.trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  type text not null check (type in ('harsh_brake', 'fast_acceleration', 'speeding')),
  occurred_at_ms bigint not null,
  value real not null,
  created_at timestamptz not null default now()
);

alter table public.trip_events enable row level security;

create policy "trip_events_select_own" on public.trip_events for select using (
  exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

create policy "trip_events_insert_own" on public.trip_events for insert with check (
  exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

create policy "trip_events_delete_own" on public.trip_events for delete using (
  exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

create index trip_events_trip_id_idx on public.trip_events (trip_id);

create index trips_user_id_started_at_idx on public.trips (user_id, started_at desc);
