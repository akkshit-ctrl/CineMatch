# CineMatch

AI-powered movie discovery and group decision-making app. Find movies by describing your "vibe" or swipe with friends to pick a group watch.

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (PostgreSQL + Realtime)
- **Movie Data**: TMDB API
- **AI**: Google Gemini 2.5 Flash

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `TMDB_API_KEY` | TMDB API read access token (api_key query param) |
| `GOOGLE_API_KEY` | Google AI Studio API key for Gemini |

## Database Setup

The Supabase schema is defined in `supabase/migrations/001_initial_schema.sql`. It includes rooms, votes, RLS policies, realtime publication, and pg_cron cleanup jobs.

To apply:
1. Go to your Supabase project dashboard → SQL Editor
2. Run the migration file contents

> **Note**: Enable the `pg_cron` extension in your Supabase dashboard (Database → Extensions) for automatic room cleanup. RLS is permissive for MVP — room codes are the security boundary.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/             # API routes (AI, TMDB proxy)
│   ├── room/            # Room pages (create, join, lobby, swipe, spin)
│   └── page.tsx         # Solo mode landing page
├── components/          # React components
│   ├── ui/              # shadcn/ui primitives
│   ├── movie-card.tsx   # Movie display card
│   └── wheel.tsx        # Decision wheel
├── lib/                 # Utilities (Supabase, TMDB, OpenAI, Room)
└── types/               # TypeScript definitions
```

## Features

- **Solo AI Mode**: Describe your mood and get movie recommendations
- **Group Rooms**: Create/join temporary rooms with a 4-character code
- **Synchronized Swiping**: Vote together on movies in real-time
- **The Wheel**: Spin to decide the final movie from matched picks
