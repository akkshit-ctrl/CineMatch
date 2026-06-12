# CineMatch Development Guidelines

Last updated: 2026-06-12

## Active Technologies

- TypeScript 5.x, Node.js 20+
- Next.js 16 (App Router)
- Tailwind CSS v4 + shadcn/ui (dark mode, mobile-first)
- Supabase (PostgreSQL + Realtime) — guest auth via sessionStorage, RLS on rooms/votes
- TMDB API (server-side proxy routes in `src/app/api/tmdb/`)
- OpenRouter / AI recommendations (server-side in `src/app/api/ai/recommend/`)
- Vitest v4 (jsdom) for testing

## Project Structure

```text
src/
  app/                    # Next.js App Router pages & API routes
    api/
      ai/recommend/       # POST — AI vibe→params
      tmdb/               # Proxy routes: discover, movies, watch, genres
    room/[id]/
      page.tsx            # Lobby (join/wait)
      swipe/page.tsx      # Swipe & vote on movies
      spin/page.tsx       # Wheel spin + result + watch providers
    page.tsx              # Solo mode (vibe search)
  components/             # React components (movie-card, wheel, ui/)
  lib/                    # Utility modules
    supabase.ts           # getSupabase() client singleton
    room.ts               # Room CRUD, voting, match pool, subscriptions
    tmdb.ts               # TMDB API wrapper
    openai.ts             # OpenAI/OpenRouter client + prompt builder
    utils.ts, database.types.ts
  types/                  # TypeScript type definitions
specs/                    # Feature specifications
.github/agents/           # Copilot instructions
```

## Architecture Decisions

- **Guest auth**: No sign-up. `crypto.randomUUID()` stored in `sessionStorage` as `cinematch_user_id`.
- **RLS**: Supabase RLS policies on `rooms` and `votes` tables. Server-side routes use service role key.
- **TMDB proxy**: All TMDB calls go through `src/app/api/tmdb/*` routes (protects API key, enables keyword resolution).
- **AI recommendations**: `/api/ai/recommend` calls OpenRouter, returns structured JSON for TMDB discover params.
- **Fallback**: If AI call fails, solo mode falls back to popular movies. Typed error states distinguish AI vs TMDB failures.
- **Testing**: Vitest with jsdom. Tests in `src/lib/__tests__/` and `src/app/__tests__/`. No mocks setup; each test file manages its own mocks.

## Completed Features

- Solo mode with vibe search, genre dropdown, search history (localStorage)
- Room creation (lobby), join with invite code
- Swipe & vote (thumbs up/down)
- Match pool calculation (51% threshold)
- Wheel spin with broadcast sync
- Watch providers display on spin result
- TMDB proxy routes (discover, movies, watch, genres)
- AI-powered vibe→params via OpenRouter
- Error type differentiation (ai_error, tmdb_error, generic_error)

## Remaining Features

- Real-time lobby participant list
- Host controls (kick, start game)
- Room expiration / cleanup
- Edge function for spin broadcast (optional replacement)

## Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run Vitest tests
npm run test:watch # Vitest watch mode
```

## Code Style

TypeScript strict mode. Follow existing patterns:
- `'use client'` for interactive pages
- `useState` + `useEffect` for data fetching (no server components for interactive pages)
- Tailwind utility classes, shadcn/ui components from `@/components/ui/`
- Server-side API routes for external API proxying

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
