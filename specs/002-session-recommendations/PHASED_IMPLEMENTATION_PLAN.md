# CineMatch Phased Implementation Plan

> **For agentic workers:** Use the executing-plans skill for inline execution, task by task. Delegation requires explicit user authorization. Checkboxes track work; no item is complete merely because it appears in this document.

**Goal:** Deliver reliable temporary solo/group movie-decision sessions with adaptive recommendations, grounded metadata, recovery, and an optional shared wheel.

**Architecture:** Keep the existing Next.js application and provider stack. Separate deterministic session/ranking logic from server-side movie/AI access. Persist authoritative group state in Supabase; use local temporary records for solo recovery.

**Tech Stack:** Next.js, React, TypeScript, Tailwind, Supabase, TMDB, OMDb, a verified free AI provider, Framer Motion, Vitest, Playwright.

## Scope and execution policy

Read PRODUCT_DESIGN.md and RESEARCH_AND_BASELINE.md first. Work only in movie_chooser. No commits, pushes, merges, pull requests, deployments, paid calls, or remote migrations/configuration changes without explicit authorization.

The Phase 1 plan contains immediate implementation examples. Later phases are actionable work packages with paths and gates; create their detailed execution slices from the verified preceding checkpoint, avoiding speculative full implementation code.

Run commands from the movie_chooser root. Existing npm test, npm run lint, and npm run build are the baseline checks. Use focused checks first and the full gate once per completed phase. Real-service integration checks are distinct from mocked tests.

## File responsibilities

Existing paths remain authoritative until implementation changes them.

| Path | Responsibility / planned action |
| --- | --- |
| src/app/page.tsx | Solo flow; reduce orchestration after introducing the session hook. |
| src/app/room/page.tsx | Create/join and shared setup. |
| src/app/room/[id]/page.tsx | Lobby, membership/preferences, controller and progress. |
| src/app/room/[id]/swipe/page.tsx | Authoritative shared deck and independent voting. |
| src/app/room/[id]/spin/page.tsx | Shortlist/selection integration and recovery of stored wheel result. |
| src/components/bottom-nav.tsx | Browser-safe mode navigation. |
| src/components/movie-hero.tsx | Shared movie information presentation; support the agreed fields. |
| src/components/swipe-deck.tsx | Correct motion lifecycle; reuse information/controls after group conversion. |
| src/components/rating-badge.tsx | Source-labelled ratings with distinct scales and unavailable states. |
| src/components/name-prompt-modal.tsx | Guest-name collection, accessible interaction, cancellation. |
| src/components/wheel.tsx | Animation driven by persisted selection; reduced-motion support. |
| src/components/watchlist-panel.tsx | Migrate permanent-sounding UI to temporary response review, then remove only if superseded. |
| src/lib/tmdb.ts | Normalize movie details, bounded retrieval and active discovery constraints. |
| src/lib/omdb.ts | Bounded optional rating retrieval/cache. |
| src/lib/openai.ts | Current adapter; migrate responsibility only after provider evaluation. |
| src/lib/room.ts | Membership/room orchestration, idempotent response commands and authoritative state reconciliation. |
| src/lib/supabase.ts | Guest client/auth configuration, with no service-role key in browser. |
| src/lib/database.types.ts | Regenerated from the approved schema; no unchecked manual casts as a schema substitute. |
| src/types/index.ts | Existing public types; migrate boolean vote and incomplete Movie contracts carefully. |
| src/lib/recommendations/types.ts — create | Shared settings, familiarity, responses, evidence and shortlist contracts. |
| src/lib/recommendations/filters.ts — create | Pure hard-constraint checks and captured release cutoffs. |
| src/lib/recommendations/ranking.ts — create | Deterministic profiles, equal group weighting and diverse shortlist selection. |
| src/lib/recommendations/service.ts — create | Server candidate retrieval, AI assistance, validation and constrained fallback. |
| src/lib/recommendations/ai.ts — create | Small free-only adapter and validated structured output. |
| src/lib/session.ts — create | Pure solo/round transitions and versioned storage payload validation. |
| src/hooks/use-solo-session.ts — create | Browser recovery and effects around the pure session state. |
| src/components/session-filters.tsx — create | Shared settings UI with explicit hard/soft distinctions. |
| src/components/movie-response-controls.tsx — create | Interested/neutral/negative actions and independent familiarity. |
| src/components/recommendation-shortlist.tsx — create | Ranked reasons, details, refinement and direct/wheel choice. |
| src/app/api/recommendations/route.ts — create | Bounded server recommendation contract for validated candidates/settings/evidence. |
| e2e/fixtures/movie-services.ts — create | Isolated deterministic provider responses and network guards. |
| e2e/solo-session.spec.ts — create | Solo flow, fallback, recovery and boundary coverage. |
| e2e/group-session.spec.ts — create | Two-context room consistency and controlled real/local integration route. |

Do not create every file upfront. Add each when the corresponding phase needs it. Split or combine responsibilities only when it simplifies actual call sites; record any change to this map.

## Phase 1 — Reconcile and stabilize

Dependency: none. Detailed steps: PHASE_1_STABILIZATION_PLAN.md.

- [x] P1.1 Record local branch/status and verify the deployment/database baseline. Correct source-only assumptions about live vote uniqueness and grants.
- [x] P1.2 Remove browser-global access from navigation render and use clear Solo/Group navigation.
- [x] P1.3 Consume the existing genre-array API contract, surface failure, and cancel stale loads.
- [x] P1.4 Resume the exact pending create/join operation once after successful name submission; cancellation performs no operation.
- [x] P1.5 Reset/stop swipe motion between movies and on unmount; reproduce consecutive left/right swipes.
- [x] P1.6 Patch the vulnerable framework/config pair in a controlled change and re-audit production dependencies. Do not blindly run audit fix --force.
- [x] P1.7 Isolate browser checks from remote services and unrelated running dev servers; replace the stale smoke expectations.

**Gate:** production build succeeds; direct /room loads; mode navigation is correct; room genres render; name continuation/cancellation tests pass; successive swipe cards return onscreen; mocked browser checks cannot write remote state. Capture unresolved backend permission issues without claiming a live room flow works.

**Checks:** focused new component/page tests, npm test, npm run lint, npm run build, npm audit --omit=dev, and the isolated smoke suite.

## Phase 2 — Movie information and session filters

Dependency: Phase 1. Main existing files: src/types/index.ts, src/lib/tmdb.ts, src/lib/omdb.ts, src/app/api/tmdb/discover/route.ts, src/app/api/tmdb/movies/route.ts, src/app/api/tmdb/watch/route.ts, src/app/api/omdb/ratings/route.ts, movie-hero.tsx, rating-badge.tsx.

- [ ] P2.1 Define normalized MovieDetails: ID, title, actual genre IDs/names, known runtime, original language, release date, source synopsis, rating values/source/count where available, country-specific certification and availability.
- [ ] P2.2 Normalize discovery versus detail responses. Correct first-card genre metadata and avoid assigning query genres to every movie.
- [ ] P2.3 Create the settings/filter contracts and pure filter functions. Enforce genre OR, English/Hindi pools, strict runtime bounds, calendar-year cutoff and unreleased exclusion.
- [ ] P2.4 Evaluate free family evidence on a representative English/Hindi sample. Implement separate children/general and adult-family choices with honest evidence/unknown labels. Reconcile unsupported content claims with the user rather than substituting AI guesses.
- [ ] P2.5 Display priority fields and available IMDb/RT/Metacritic/TMDB ratings. Normalize N/A/missing values, preserve source scales, bound concurrency, and permit failed lookups to retry.
- [ ] P2.6 Make watch-provider lookup country-explicit, default India, distinguish unknown/error from no listed provider, show provider type and the supplied destination/attribution.
- [ ] P2.7 Validate IDs/pages/runtime/date bounds and bulk limits at API boundaries. Reject fractions, non-finite values and excessive batches before upstream requests; use cancellation/timeouts.

**Tests — create:** src/lib/recommendations/__tests__/filters.test.ts and src/lib/__tests__/omdb.test.ts. Extend existing TMDB/API tests and create src/components/__tests__/rating-badge.test.tsx.

**Gate:** active hard filters never admit missing/violating metadata; first-card information is correct; absent ratings remain usable; repeat lookup can retry; India availability is visibly scoped; both family contexts have reviewed, source-supported behavior.

**Checks:** npm run test -- src/lib/recommendations/__tests__/filters.test.ts src/lib/__tests__/tmdb.test.ts src/lib/__tests__/omdb.test.ts src/app/__tests__/api; then full test/lint/build gate and mobile/desktop field review.

## Phase 3 — Solo adaptive session

Dependency: Phase 2. Main files: recommendations modules, session.ts, use-solo-session.ts, src/app/page.tsx, src/app/api/ai/recommend/route.ts, new recommendations route, response controls/shortlist, current temporary saved panel and movie-hero.tsx.

- [ ] P3.1 Implement explicit response/familiarity types and pure transitions. Each response records/advances once; familiarity alone does neither. Completion happens after the final response.
- [ ] P3.2 Implement a versioned 30-minute inactivity record with restoration, validation, storage-failure handling and explicit new-session reset. Stop creating persistent search history without deleting unrelated legacy records.
- [ ] P3.3 Implement varied candidate retrieval and the deterministic session profile/ranker. Separate voting-deck deduplication from final-shortlist eligibility.
- [ ] P3.4 Verify free account status; evaluate existing Gemini against the deterministic baseline and one suitable free alternative if needed. Do not make inference calls before this cost gate.
- [ ] P3.5 Add bounded AI interpretation/reranking with candidate-ID validation, request/attempt caps, timeout and stale-response protection. Genre-only discovery must not be called an AI outage.
- [ ] P3.6 Integrate 10 initial responses, ranked shortlist, rewatch preference, optional five-card refinement, direct selection and optional solo wheel.
- [ ] P3.7 Preserve hard constraints in fallback and distinguish insufficient candidates/evidence from provider failures.
- [ ] P3.8 Run the deterministic recommendation scenarios and begin human relevance review. Record quality deficiencies before promoting the algorithm to group use.

**Tests — create:** src/lib/__tests__/session.test.ts, src/lib/recommendations/__tests__/ranking.test.ts, src/lib/recommendations/__tests__/service.test.ts, src/app/__tests__/api/recommendations.test.ts, e2e/solo-session.spec.ts.

**Gate:** complete solo flow works with and without AI; unknown is neutral; seen-liked candidates can win; repeated requests cannot overwrite newer sessions; recovery works just before and expires at 30 minutes; all constraints and free-only routing hold. Quality evidence is reported separately from mechanical test results.

**Checks:** focused new tests, isolated solo E2E, full test/lint/build; bounded human/provider comparison after the free-access gate.

## Phase 4 — Authoritative group sessions

Dependency: Phase 3 and approved local schema/access design. Main files: room.ts, supabase.ts, database.types.ts, room pages, recommendations service, wheel.tsx, Supabase migration/config files.

- [ ] P4.1 Reconcile live migration history into a reproducible local baseline. Rehearse locally; preserve legacy columns until consumers migrate.
- [ ] P4.2 Evaluate invisible anonymous authentication and membership-based authorization. Document project setting changes, free-tier limits, credential lifetime and stale guest cleanup. Test unauthorized reads/writes and cross-room access.
- [ ] P4.3 Add durable membership, settings, immutable round decks, explicit responses/familiarity, shortlist revisions, controller and expiry. Enforce unique participant/round/movie responses with idempotent retries and capacity atomically.
- [ ] P4.4 Generate each group deck/recommendation revision once under a database transition/generation claim. Deduplicate racing requests; reject stale revision writes.
- [ ] P4.5 Implement independent progress, optional personal preferences, initial-round late joins, completion barrier and explicit early finish. Freeze the roster at round close.
- [ ] P4.6 Own each realtime channel once; handle timeout/error/close/unmount and reconcile from persisted state after reconnect. Vote persistence success must not be lost because notification failed.
- [ ] P4.7 Implement atomic controller transfer; preserve room activity after departure and debounce transient network loss.
- [ ] P4.8 Restore the same participant/response progress within 30 minutes, enforce the one-hour room boundary in operations, and update cleanup through a rehearsed migration.
- [ ] P4.9 Persist one shortlist and wheel selection before notification. Read the winner after reload or missed events; prohibit clients from writing their own animation result.
- [ ] P4.10 Test two isolated sessions plus a 10-participant scenario, then prepare a concrete remote migration/configuration checklist and rollback/compatibility assessment for review.

**Planned tables/records:** extend rooms; room_participants; room_rounds; explicit movie responses (migrate votes); persisted shortlist/selection records. Final SQL names/types belong in the Phase 4 execution slice after baseline rehearsal.

**Tests:** extend src/lib/__tests__/room.test.ts and integration.test.ts; create membership/transition SQL checks in the local Supabase test environment; e2e/group-session.spec.ts with separate contexts.

**Gate:** identical decks/results across clients; correct resume and capacity; no duplicate progression; late joins and early finish follow policy; host departure continues; invalid/expired/nonmember operations are denied. Passing mocks alone does not complete this phase: a local or explicitly authorized test-project database/realtime integration check is required.

**Remote boundary:** no apply_migration, auth-setting changes, grants, cleanup deletion or production writes until explicitly authorized against the reviewed artifact. Free-only requirement excludes provisioning paid branches.

## Phase 5 — Responsive UX and accessibility

Dependency: working solo/group flows. Main files: page layouts, globals.css, session filters, movie information/controls, name-prompt-modal.tsx, shortlist, wheel, navigation.

- [ ] P5.1 Fit phone/laptop layouts deliberately, using desktop space for information and progress without oversized empty gutters.
- [ ] P5.2 Give title, actual genres, runtime, source ratings and synopsis visual priority. Expand details without hiding essential decisions.
- [ ] P5.3 Fix low contrast, visible focus, touch targets and keyboard access. Make neutral and seen controls understandable without gesture knowledge.
- [ ] P5.4 Make dialogs labelled, focus-contained, Escape-dismissable and focus-restoring; cancellation cancels the pending operation.
- [ ] P5.5 Explain loading/generation, unknown suitability, sparse evidence, waiting participants, lost connection and expiration. Keep implementation jargon out of the product.
- [ ] P5.6 Respect reduced motion, cancel abandoned animations, bound wheel labels, and show the persisted choice immediately when appropriate.
- [ ] P5.7 Review at 360px, 390px, 768px and 1440px, keyboard-only and reduced-motion settings. Preserve current styling; a separate visual redesign waits for inspirations.

**Tests:** extend component regressions and existing E2E cases for keyboard/dialog/focus and overflow. Use screenshots as review evidence rather than asserting subjective aesthetics through unit tests.

**Gate:** no horizontal overflow or inaccessible essential action; readable synopsis/ratings; equivalent button and gesture outcomes; usable modal and reduced-motion result.

## Phase 6 — Quality, documentation and release readiness

Dependency: Phases 1–5.

- [ ] P6.1 Complete at least 20 deterministic scenarios and at least 10 human-reviewed sessions; compare the shortlist with filtered baseline, including divided group tastes and refinement benefit.
- [ ] P6.2 Establish a bounded check command and optional GitHub CI definition with mocked services and no production write credentials. Verify proposed workflow locally before enabling external runs.
- [ ] P6.3 Consolidate root README, product design, architecture/data contracts, phase status and verification guide. Archive superseded specifications with an index, update stale constitution/tool instructions, and preserve active scaffolding.
- [ ] P6.4 Remove only confirmed unused production modules and tests for retired behavior after import/call-site inspection. Exclude generated coverage/test artifacts from lint/tracking.
- [ ] P6.5 Re-audit dependencies and inspect the complete diff. Report unresolved advisory applicability accurately.
- [ ] P6.6 Reconcile Vercel environment variable names without revealing values, migration version compatibility, and current deployed commit. Prepare deployment/migration instructions, but do not push or publish.
- [ ] P6.7 Save a phase checkpoint: files changed, commands/results, live versus mocked evidence, recommendation review, known limitations and next action.

**Gate:** all agreed requirements have test/review evidence; quality target is assessed; docs match code and schema; final production build passes; release limitations are explicit. Publication is a separate authorized action.

## Requirement coverage

| Requirement IDs | Phases |
| --- | --- |
| R01 | 1, 3, 4, 5 |
| R02–R03 | 2, 3, 4 |
| R04–R06 | 3, 4, 5 |
| R07–R09 | 3, 4 |
| R10–R15 | 4 |
| R16–R17 | 3, 4 |
| R18–R23 | 2, 3, 4, 5 |
| R24 | 3, 4, 5 |
| R25 | 3, 4, 6 |
| R26–R27 | all phases, with consolidation in 6 |

## Phase checkpoint template

~~~text
Phase:
Commit/branch inspected:
Scope implemented:
Files changed:
Focused checks and results:
Full checks and results:
Browser/database evidence:
Mocked versus live:
Recommendation quality evidence:
Unresolved issues:
External changes proposed/applied:
Next eligible task:
~~~

Do not mark a checkbox complete for a proposed implementation, a stale test result, or an unverified remote setting.
