# Quickstart: CineMatch MVP

## Prerequisites
- Node.js 20+
- Supabase Project (URL + Anon Key)
- TMDB API Key (Read Access Token)
- Google AI Studio API Key (for Gemini)

## Environment Setup
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TMDB_API_KEY=your-tmdb-key
GOOGLE_API_KEY=your-google-ai-studio-api-key
```

## Database Setup

Run the migration in `supabase/migrations/001_initial_schema.sql` via the Supabase SQL Editor. This creates the rooms and votes tables, enables RLS with permissive policies, adds realtime publication, and schedules pg_cron cleanup jobs.

> **Note**: Enable the `pg_cron` extension in your Supabase dashboard (Database → Extensions) for automatic room cleanup. RLS is intentionally permissive for MVP — room codes are the sole security boundary.

## Installation
```bash
npm install
npm run dev
```

## Key Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
