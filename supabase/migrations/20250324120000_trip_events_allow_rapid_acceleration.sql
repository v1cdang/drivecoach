-- App emits 'rapid_acceleration'; init migration only allowed 'fast_acceleration'.

do $$
declare
  constraint_name text;
begin
  select c.conname
  into constraint_name
  from pg_constraint c
  join pg_class t on c.conrelid = t.oid
  join pg_namespace n on t.relnamespace = n.oid
  where n.nspname = 'public'
    and t.relname = 'trip_events'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%harsh_brake%';
  if constraint_name is not null then
    execute format('alter table public.trip_events drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.trip_events
  add constraint trip_events_type_check check (
    type = any (
      array['harsh_brake', 'fast_acceleration', 'rapid_acceleration', 'speeding']::text[]
    )
  );
