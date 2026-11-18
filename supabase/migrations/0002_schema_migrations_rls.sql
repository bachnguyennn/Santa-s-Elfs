-- The migration runner creates schema_migrations itself (outside 0001), so it
-- missed the RLS lockdown: without it Supabase's anon/authenticated roles could
-- read or tamper with it through PostgREST (e.g. mark a future migration as applied).
alter table schema_migrations enable row level security;
