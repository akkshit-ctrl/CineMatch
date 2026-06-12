# CineMatch Migrations

## Applying Migrations

Copy the contents of each `.sql` file into the **Supabase SQL Editor** (Dashboard → SQL Editor) and run it.

Migrations are ordered by their numeric prefix. Apply them in sequence:

1. `001_initial_schema.sql`

## pg_cron Extension

The `pg_cron` extension must be enabled manually in the Supabase dashboard:

1. Go to **Database → Extensions**
2. Search for `pg_cron`
3. Click **Enable**

Until pg_cron is enabled, the `cron.schedule(...)` calls at the end of migration 001 will fail. You can comment those out if you do not plan to use automatic room cleanup.

## Security Note

This MVP uses **room-code-based access** as the sole security boundary. All RLS policies allow access to the `anon` role. This is a **temporary compromise** — anyone with the Supabase anon key (which is embedded in the client) can read/write rooms and votes.

**TODO before production launch:** Replace with proper Supabase Auth + user-id-based RLS policies.

## Rollback

There is no dedicated down migration. To roll back, run the following in the SQL Editor:

```sql
-- Drop functions
drop function if exists cast_vote;

-- Drop tables (votes first due to FK constraint)
drop table if exists votes;
drop table if exists rooms;

-- Remove realtime publication (run for each table)
alter publication supabase_realtime drop table rooms;
alter publication supabase_realtime drop table votes;

-- Remove cron jobs (if pg_cron is enabled)
select cron.unschedule('cleanup-old-rooms');
select cron.unschedule('cleanup-abandoned-lobbies');
```
