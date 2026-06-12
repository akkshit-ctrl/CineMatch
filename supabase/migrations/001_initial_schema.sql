-- 001: Initial Schema for CineMatch MVP
-- Includes: tables, RLS, realtime, functions, pg_cron cleanup
begin;

-- ============================================
-- TABLES
-- ============================================

create table if not exists rooms (
  id text primary key,
  host_id uuid not null,
  status text default 'lobby' check (status in ('lobby', 'swiping', 'spinning', 'result')),
  genre_id int,
  match_pool jsonb default '[]'::jsonb,
  tmdb_config jsonb default null,
  created_at timestamptz default now()
);

create table if not exists votes (
  id bigint generated always as identity primary key,
  room_id text references rooms(id) on delete cascade,
  user_id uuid not null,
  movie_id int not null,
  vote boolean not null,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_votes_room_id on votes(room_id);
create index if not exists idx_votes_room_movie on votes(room_id, movie_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- NOTE (security compromise): This MVP uses room-code-based access as the
-- sole security boundary. Anyone with the room code can read/write rooms
-- and votes. This is a TEMPORARY measure -- in production, this should be
-- tightened with proper auth (Supabase Auth + RLS on user_id/host_id).
-- TODO: Replace with auth-based RLS before production launch.

alter table rooms enable row level security;
alter table votes enable row level security;

-- Rooms: anyone with anon key can create (insert)
create policy rooms_insert on rooms
  for insert to anon
  with check (true);

-- Rooms: anyone can view (room code is the auth boundary)
create policy rooms_select on rooms
  for select to anon
  using (true);

-- Rooms: anyone can update (we trust the room-code boundary)
create policy rooms_update on rooms
  for update to anon
  using (true)
  with check (true);

-- Rooms: only service role can delete (cron cleanup)
create policy rooms_delete on rooms
  for delete to service_role
  using (true);

-- Votes: anyone can insert
create policy votes_insert on votes
  for insert to anon
  with check (true);

-- Votes: anyone can view vote counts
create policy votes_select on votes
  for select to anon
  using (true);

-- ============================================
-- CAST VOTE FUNCTION
-- ============================================
-- Atomic vote insertion. This replaces direct client-side inserts
-- for better reliability and future-proofing.

create or replace function cast_vote(
  p_room_id text,
  p_user_id uuid,
  p_movie_id int,
  p_vote boolean
)
returns void
language plpgsql
security definer
as $$
begin
  insert into votes (room_id, user_id, movie_id, vote)
  values (p_room_id, p_user_id, p_movie_id, p_vote);
end;
$$;

-- ============================================
-- REALTIME PUBLICATION
-- ============================================
-- Ensure rooms and votes are published for realtime subscriptions.

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table votes;

-- ============================================
-- ROOM CLEANUP (pg_cron)
-- ============================================
-- NOTE: This requires the pg_cron extension to be enabled in your
-- Supabase project dashboard (Database -> Extensions -> enable pg_cron).

-- Delete rooms older than 24 hours (votes cascade-delete automatically)
select cron.schedule(
  'cleanup-old-rooms',
  '0 */6 * * *',
  $$ delete from rooms where created_at < now() - interval '24 hours' $$
);

-- Delete abandoned lobbies (rooms stuck in 'lobby' for over 1 hour)
select cron.schedule(
  'cleanup-abandoned-lobbies',
  '*/30 * * * *',
  $$ delete from rooms where status = 'lobby' and created_at < now() - interval '1 hour' $$
);

commit;
