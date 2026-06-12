# Research: CineMatch MVP

**Feature**: CineMatch MVP
**Date**: 2025-12-24
**Status**: Complete

## 1. Data Source: TMDB API

**Decision**: Use TMDB API (The Movie Database)
**Rationale**: Free tier is generous, provides high-quality posters, and has robust discovery filters.
**Implementation Details**:
- **Base URL**: `https://api.themoviedb.org/3`
- **Discovery**: `GET /discover/movie`
  - `with_genres`: Filter by genre IDs (e.g., 27 for Horror).
  - `with_keywords`: Filter by keyword IDs (requires a separate lookup step or AI mapping).
  - `primary_release_date.gte/lte`: For year ranges.
  - `sort_by`: `popularity.desc` (default) or `vote_average.desc`.
- **Images**: `https://image.tmdb.org/t/p/w500/{poster_path}`
- **Auth**: `api_key` query parameter (Environment Variable).

## 2. Real-Time Engine: Supabase Realtime

**Decision**: Supabase Realtime (PostgreSQL Changes + Presence)
**Rationale**: Simplifies stack (Database + Realtime in one), handles "Presence" (who is online) out of the box.
**Implementation Details**:
- **Room State**: Listen to `postgres_changes` on `rooms` table (filter by `id=eq.ROOM_ID`).
- **Participants**: Use `channel.presence` to track connected users.
  - `sync`: Initial load of users.
  - `join`: User enters.
  - `leave`: User disconnects.
- **Events**:
  - `SPIN_START`: Broadcast via `channel.send({ type: 'broadcast', event: 'SPIN_START', payload: ... })`.

## 3. AI Logic: Google Gemini (gemini-2.5-flash)

**Decision**: Google Gemini API directly using `gemini-2.5-flash`.
**Rationale**: Gemini 2.5 Flash is extremely fast, has a large context window, supports JSON output well, and is accessed via an OpenAI-compatible endpoint — avoiding third-party relay services.
**Implementation Details**:
- **Base URL**: `https://generativelanguage.googleapis.com/v1beta/openai/`
- **Client**: Use standard `openai` npm package, but override `baseURL`.
- **Model**: `gemini-2.5-flash`
- **Auth**: `GOOGLE_API_KEY` environment variable.
- **Prompt Strategy**:
  - System: "You are a movie expert. Convert user 'vibes' into TMDB discovery parameters. Output valid JSON only."
  - User: "I want a 90s sci-fi thriller."
  - Output Schema: `{ keywords: string[], genre_ids: number[], year_range: { min: number, max: number }, sort_by: string }`.

## 4. UI/UX: Framer Motion

**Decision**: Framer Motion for animations.
**Rationale**: Industry standard for React animations, excellent support for gesture-based interactions (swiping).
**Implementation Details**:
- **Swipe Cards**: `useMotionValue`, `useTransform` (rotate on drag), `dragConstraints`.
- **Wheel**: `animate` with `rotate: 360` loop, then ease out to specific angle based on winner.

## 5. Alternatives Considered

- **Socket.io**: Requires a custom Node.js server (hosting complexity). Supabase is serverless-friendly.
- **Pusher**: Good for realtime, but requires separate DB. Supabase unifies them.
- **OpenRouter relay**: Adds latency and a third-party dependency. Direct Gemini calls are simpler and more reliable.
