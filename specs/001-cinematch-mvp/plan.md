# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

CineMatch is a web-based movie decision app featuring a "Solo Mode" for AI-driven recommendations and a "Group Mode" for real-time collaborative filtering. The MVP will be built using Next.js 15 (App Router) and Tailwind CSS/shadcn/ui for a cinematic, dark-mode interface. Real-time synchronization for group rooms (lobby, swiping, wheel spin) will be handled by Supabase Realtime. Movie data will be sourced from TMDB, and OpenAI will power the natural language "vibe" search.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Framework**: Next.js 15 (App Router)
**Primary Dependencies**: 
- `shadcn/ui` (UI Components)
- `framer-motion` (Animations)
- `@supabase/supabase-js` (Realtime & DB)
- `openai` (AI Logic - via OpenRouter)
- `lucide-react` (Icons)
**Storage**: Supabase (PostgreSQL) for room state (ephemeral)
**Testing**: Vitest (Unit), Playwright (E2E)
**Target Platform**: Vercel (Web), Mobile-First Responsive
**Project Type**: Web Application (Monorepo structure not required yet)
**Performance Goals**: <200ms latency for real-time events, <1.5s LCP
**Constraints**: No persistent user auth (guest only), TMDB API rate limits
**Scale/Scope**: MVP focused on stability for ~50 concurrent rooms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Real-Time Synchronization**: Plan uses Supabase Realtime for all room states.
- [x] **II. Democratic Selection Logic**: Spec defines 51% majority rule.
- [x] **III. Cinematic & Mobile-First UI**: Stack includes Tailwind + shadcn/ui + Framer Motion.
- [x] **IV. AI-Augmented Discovery**: Plan includes OpenRouter integration for "vibe" search.
- [x] **V. Performance & Simplicity**: Next.js App Router + ephemeral rooms (no auth) aligns with simplicity.

## Project Structure

### Documentation (this feature)

```text
specs/001-cinematch-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── app/                 # Next.js App Router
│   ├── api/             # API Routes (AI, TMDB proxy)
│   ├── room/[id]/       # Group Room Pages
│   └── page.tsx         # Landing/Solo Mode
├── components/          # React Components
│   ├── ui/              # shadcn/ui primitives
│   ├── movie-card.tsx   # Swipeable card
│   └── wheel.tsx        # Decision wheel
├── lib/                 # Utilities
│   ├── supabase.ts      # Supabase client
│   ├── tmdb.ts          # TMDB API wrapper
│   └── openai.ts        # AI logic
└── types/               # TypeScript definitions
```

**Structure Decision**: Single Next.js project structure (Option 1 variant) chosen for simplicity and speed of MVP development.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
