-- Ensure every auth user has a public.users row (trips.user_id FK targets public.users).
-- Users who registered before this schema or when the trigger failed would otherwise
-- get "trips_user_id_fkey" violations on trip insert.
insert into public.users (id, email)
select id, email
from auth.users
on conflict (id) do update
set email = excluded.email;
