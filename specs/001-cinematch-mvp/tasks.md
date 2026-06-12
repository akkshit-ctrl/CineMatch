---
description: "Task list for CineMatch MVP implementation"
---

# Tasks: CineMatch MVP

**Input**: Design documents from `/specs/001-cinematch-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: [US1] Solo AI, [US2] Rooms, [US3] Swiping, [US4] Wheel
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 15 project with Tailwind and shadcn/ui in `src/`
- [ ] T002 Configure Supabase client and environment variables in `src/lib/supabase.ts`
- [ ] T003 Implement TMDB API wrapper with types in `src/lib/tmdb.ts`
- [ ] T004 Configure OpenRouter client in `src/lib/openai.ts`
- [ ] T005 Create basic layout with dark mode theme provider in `src/app/layout.tsx`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data structures and API routes needed for all stories

- [ ] T006 [P] Create API route for TMDB proxy in `src/app/api/tmdb/discover/route.ts`
- [ ] T007 [P] Create API route for AI recommendations in `src/app/api/ai/recommend/route.ts`
- [ ] T008 Define TypeScript interfaces for Room, Participant, and Movie in `src/types/index.ts`

## Phase 3: User Story 1 - Solo AI Discovery (Priority: P1)

**Goal**: Enable users to find movies via "vibe" search.

- [ ] T009 [US1] Create AI prompt generation logic in `src/lib/openai.ts`
- [ ] T010 [US1] Implement Solo Mode page with Genre/Vibe input form in `src/app/page.tsx`
- [ ] T011 [US1] Create MovieCard component for displaying results in `src/components/movie-card.tsx`
- [ ] T012 [US1] Connect Solo Mode form to AI API and display results in `src/app/page.tsx`

## Phase 4: User Story 2 - Group Room Creation & Joining (Priority: P1)

**Goal**: Enable users to create and join temporary rooms.

- [ ] T013 [US2] Implement "Create Room" function (Supabase insert) in `src/lib/room.ts`
- [ ] T014 [US2] Implement "Join Room" function (check code, add participant) in `src/lib/room.ts`
- [ ] T015 [US2] Create Room Lobby page with participant list in `src/app/room/[id]/page.tsx`
- [ ] T016 [US2] Implement Supabase Realtime subscription for room updates in `src/app/room/[id]/page.tsx`

## Phase 5: User Story 3 - Synchronized Swiping (Priority: P1)

**Goal**: Enable real-time voting on a shared movie queue.

- [ ] T017 [US3] Implement "Start Swiping" action (update status, fetch movies) in `src/app/room/[id]/actions.ts`
- [ ] T018 [US3] Create SwipeDeck component with Framer Motion in `src/components/swipe-deck.tsx`
- [ ] T019 [US3] Implement vote submission logic (Supabase RPC `cast_vote`) in `src/lib/supabase.ts`
- [ ] T020 [US3] Implement real-time vote counting and match detection in `src/app/room/[id]/page.tsx`
- [ ] T020a [US3] Create Supabase Database Function `cast_vote` to handle atomic increments and match logic

## Phase 6: User Story 4 - The Wheel Decision (Priority: P2)

**Goal**: Pick a winner from the match pool.

- [ ] T021 [US4] Create Wheel component with Framer Motion animation in `src/components/wheel.tsx`
- [ ] T022 [US4] Implement "Spin" action (broadcast SPIN_START event) in `src/app/room/[id]/actions.ts`
- [ ] T023 [US4] Handle SPIN_START event to trigger animation and show result in `src/app/room/[id]/page.tsx`

## Phase 7: Polish & Cross-Cutting

- [ ] T024 [P] Add error handling for API failures (TMDB/OpenAI)
- [ ] T025 [P] Optimize mobile responsiveness for SwipeDeck
- [ ] T026 [P] Add "Copy Room Code" button and toast notifications
- [ ] T027 [Edge] Implement "No Matches Found" UI with "Load More" button
- [ ] T028 [Edge] Configure Supabase pg_cron or RLS policy for room cleanup (TTL)

## Dependencies

- US1 (Solo) is independent.
- US2 (Rooms) is a prerequisite for US3 and US4.
- US3 (Swiping) is a prerequisite for US4 (Wheel).

## Implementation Strategy

1.  **MVP 1**: Complete Phase 1, 2, and 3 (Solo Mode). This delivers value immediately.
2.  **MVP 2**: Complete Phase 4 and 5 (Group Swiping).
3.  **MVP 3**: Complete Phase 6 (Wheel) to finish the loop.
