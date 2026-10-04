# CineMatch product design

Date: 2026-10-04.

Status: product choices and recommendation approach agreed with the user. Technical mechanisms and initial ranking parameters below are engineering proposals for implementation review, not completed features or validated quality claims.

## Purpose and scope

CineMatch helps one person or a small group choose a movie for the current occasion. It is a personal project, initially used by its owner, with possible later use by friends and family.

Both solo and group modes belong in this version. Solo is stabilized first. Support phones and laptops through a responsive website. Keep the current cinematic styling until the user supplies visual inspirations; do not undertake a speculative redesign.

There is no persistent watch history, personal recommendation profile, or permanent watchlist. Temporary session recovery is required. Ratings and provider catalog caches are infrastructure data, not personal viewing history.

## Requirements

| ID | Requirement |
| --- | --- |
| R01 | Include both solo and group modes; opening the website starts solo discovery, with a prominent Group entry. |
| R02 | Accept mood, genres, or both. Multiple genres use OR eligibility, with relevant combinations allowed to rank higher. |
| R03 | Initially offer 10 varied cards mixing popular and discovery-oriented titles; permit fewer only when qualifying supply is exhausted and explain this. |
| R04 | Support Interested, Not interested, and Unsure. Unsure contributes no preference evidence. Every response advances exactly once. |
| R05 | Offer an optional I've seen this marker independent of interest; unmarked familiarity is unknown, not unwatched. |
| R06 | Offer Open to either, Prefer something I haven't seen, and Rewatch welcome. Familiarity is per person and per session. |
| R07 | Produce a ranked shortlist of approximately 3–5 movies with grounded reasons and an optional pick-for-me wheel. Fewer qualified results are preferable to violating constraints. |
| R08 | Permit an optional five-card refinement round; in groups, one shared refined deck reflects combined preferences. Do not automatically repeat cards within voting rounds. |
| R09 | Liked swipe candidates remain eligible for the shortlist but are not automatically included. Additional candidates may qualify. Seen movies remain eligible for rewatches. |
| R10 | Group setup includes shared genres, optional shared mood, and optional participant preferences entered before their first response. |
| R11 | Everyone receives the same ordered group deck and swipes independently. Support at most 10 participants. |
| R12 | Favor broad group appeal with equal participant weight. A negative response lowers group fit; it is not an automatic global veto. Missing responses and Unsure are not negative votes. |
| R13 | The host controls starting and progression; transfer control to a remaining participant when the host departs. |
| R14 | Wait for participants by default, display progress, and allow the controller to explicitly finish a round early. |
| R15 | Allow participating late joins while the initial round is open. After initial completion, new arrivals may view results but cannot change that completed round. |
| R16 | Support approximately 30 minutes of inactivity recovery for solo and 30 minutes to recover a disconnected group participant, on the same browser/device. |
| R17 | Rooms expire one hour after creation, regardless of activity. Room expiry takes precedence over a participant's remaining recovery time. |
| R18 | Default to movies originally released in English or Hindi; allow either language or both. Display language and do not infer dubbed availability. |
| R19 | Provide optional runtime maximums and release ranges, including Less than 2 hours and Within the last 5/15 years. |
| R20 | Provide separate family choices for Children/general audiences and With parents/adult family. They have different meanings and evidence limits; neither is a universal content guarantee. |
| R21 | No extra content restrictions by default, apart from the existing exclusion of source-classified adult entries. Family options apply only when selected. |
| R22 | Prioritize movie name, actual genres, runtime, sourced ratings, and a short source synopsis. Show IMDb, Rotten Tomatoes, Metacritic, and TMDB ratings when available, with their own scales and clear source labels. Google ratings are excluded initially. |
| R23 | Streaming information defaults to India, with a country selector. Availability is informational; do not filter recommendations by provider. |
| R24 | Use visible Not interested / Unsure / Interested buttons and an optional seen toggle. Horizontal swipes are shortcuts; vertical neutral gestures are deferred. |
| R25 | Use only free AI access with bounded calls. Continue with a filtered, session-aware fallback when AI fails, and disclose reduced personalization. |
| R26 | Organize documentation, consolidate duplication, archive superseded material, and preserve active tools. Do not break features through cleanup. |
| R27 | Deliver in phases, with meaningful regression checks and explicit evidence of recommendation quality, group consistency, and recovery. |

## Session flow

### Solo

1. Configure preferences. Starting requires at least mood or genre; other settings are optional.
2. Retrieve a varied eligible deck and show 10 cards.
3. Record response and familiarity independently. Marking seen alone does not advance or create a positive response.
4. Generate a shortlist when the round is completed. If evidence is sparse, disclose this and offer the optional refinement round.
5. Choose a title directly, refine through five additional cards, or spin the wheel.
6. Recover the session after a refresh within the inactivity window. Start over explicitly clears only the current session.

Interested replaces the misleading implication of permanently saving a movie. A temporary review panel may show positive responses; its label must make its session lifetime clear. There is no new persistent watchlist.

### Group

1. The host enters shared filters and creates a room.
2. Guests enter a display name and may add a short individual preference. No user-facing signup is required.
3. The host starts one shared, immutable initial deck. Each participant proceeds at their own pace.
4. Late joins before initial completion get that same deck. The controller sees completion progress.
5. Close the round when everybody finishes, or after an explicit early-finish action. Freeze the participating roster for that completed round.
6. Generate and persist one ranked shortlist. New candidates are predicted preferences, not falsely labelled approved choices.
7. The controller can begin a shared refinement round for the frozen roster or start the wheel. Persist a new shortlist revision when refinement completes.
8. All clients read the same final choice. Refreshing, joining as a viewer, or missing a broadcast does not select a different movie.

## Filter semantics

- Languages are original languages. Fetch separate English/Hindi candidate pools if the provider cannot express both reliably in one request; merge and deduplicate by movie ID.
- Genre eligibility is OR. Other explicitly selected constraints apply together.
- Less than 2 hours means a known runtime below 120 minutes. Missing/zero runtime cannot qualify for an active runtime constraint.
- Release ranges use a captured UTC session date and calendar-year subtraction, with a defined February 29 clamp. Exclude future/unreleased titles. Persist the effective cutoff so room clients cannot calculate different ranges.
- Mood and optional personal preferences are soft guidance; they cannot silently override selected language, runtime, release, or family settings.
- Do not relax hard constraints in fallback. Offer an explicit filter adjustment instead.

### Family viewing

These are two separate selectable contexts, not one combined family flag.

Children/general audiences uses available certification evidence. For the initial India setting, a known general-audience certification may qualify; evaluate actual metadata coverage before release. Missing classification is not evidence of suitability. Do not silently treat another country's rating as an Indian certification.

With parents/adult family expresses a preference to avoid explicit sexual content and awkward adult material. Age certification alone does not prove that such material is absent. Evaluate free certification, keyword, and content-advisory coverage; show the actual information and any uncertainty. AI may assist preference matching but must not invent an advisory or certify a movie as safe.

The Phase 2 research gate determines which content claims the available sources can support. If explicit-content evidence is insufficient, retain adult-family viewing as a disclosed preference and show suitability unknown; do not market it as a verified exclusion filter. Any proposed change to the requested behavior must be brought back to the user before acceptance of that phase.

### Familiarity

Seen means known seen; all other cases are unknown. Prefer something I haven't seen downranks known-seen titles; it cannot guarantee unknown titles are unwatched. Rewatch welcome allows and favors suitable known-seen titles without forcing a quota.

In a group, familiarity is individual. Show factual summaries such as Seen by 2 participants, not Everyone else hasn't watched it.

## Recommendation architecture

Keep the existing Next.js application, TMDB data access, Supabase room storage/realtime, and installed UI libraries. Add focused modules rather than a framework, multi-agent runtime, catalogue-wide analysis pipeline, or trained recommendation model.

### 1. Candidate retrieval

Fetch bounded pools from discover queries, popular/high-confidence titles, and related-title retrieval for positively received candidates. Populate details required for active filters. Deduplicate IDs and enforce constraints before ranking and again before the final response.

For the initial 10-card deck, target five recognizable/popular candidates and five varied discovery-oriented candidates when supply allows. Avoid near-identical sequels dominating the deck. This split is an initial sampling heuristic, not a relevance claim. In a group, generate once and persist the IDs/order.

Already displayed IDs are excluded from subsequent voting decks to prevent repeated rating. That exclusion must not be applied to the final shortlist: a liked displayed movie can still be a good answer.

### 2. Session evidence

Represent responses explicitly as interested, not_interested, or unsure; represent familiarity as seen or unknown. Do not overload a boolean or a missing row to mean unsure.

Build one bounded preference profile per participant. Positive and negative examples inform genres, themes, and tone when supported by metadata. One disliked horror movie does not establish a permanent dislike of every horror film. Solo negative responses exclude that specific title from the current final shortlist; group negatives lower its score for the relevant person.

Compute participant profiles from their mean evidence, not their raw response counts, so a faster participant cannot dominate.

### 3. AI assistance

Use at most four logical AI requests per complete session/room: initial mood interpretation, first shortlist assistance, optional refinement selection, and refined shortlist assistance. Calls are shared per group session, not multiplied by participant count. Use one bounded retry for transient failures; enforce a total attempt cap of six and avoid retrying a daily-quota failure.

Send movie metadata and anonymous per-participant signals, not names, account identifiers, room codes, or recovery tokens. Limit input size, validate structured output, and accept only supplied/verified movie IDs. Never use raw model prose as a synopsis, rating, runtime, certification, or streaming claim.

Keep a small provider adapter. Start evaluation with the existing Gemini integration if its account is verified free. OpenRouter free models are the next candidate. Fail closed against paid routing.

### 4. Ranking and diversity

Implement a deterministic content-based baseline first. Its inputs are current settings, normalized participant profiles, direct movie responses, known familiarity, and evidence-backed metadata. Popularity and rating confidence are supporting priors, not substitutes for taste.

For the initial group baseline, aggregate 75% mean participant fit and 25% lowest evidenced participant fit. Give each contributing participant equal weight. A person with only unsure/missing responses supplies no fabricated negative evidence; their explicit preferences can still supply guidance. Record coverage separately.

The aggregation blend is a proposed starting heuristic to evaluate, not an algorithm claimed to be research-validated. Compare it with plain mean fit using the evaluation fixtures before fixing production weights.

Construct the shortlist greedily from suitable candidates while penalizing excessive similarity to already selected titles. Include direct liked candidates and fresh candidates based on suitability, not a mandatory quota. Enforce hard filters independently of AI scores.

Reasons must point to actual settings, supported metadata, or participant evidence. Use descriptions such as Fits your preference for courtroom dramas and is under two hours. Do not display invented numerical confidence percentages.

### 5. Fallback

Reuse eligible candidates and deterministic session evidence when AI fails. Preserve language, runtime, release, family evidence rules, familiarity, and group weighting. Disclose that nuanced mood matching is limited. Distinguish AI failure from movie-data failure and insufficient supply.

## State, storage, and access

### Solo

Use a versioned local browser record with session ID, settings, deck, responses, shortlist, final choice, and last interaction time. localStorage permits recovery after closing/reopening a tab on the same browser/device. Validate records before restoration and enforce a 30-minute inactivity limit.

Clock and storage errors must produce a usable new-session path. Handle unavailable/full storage without breaking discovery. Do not extend lifetime through background polling. Stop creating cross-session search history; preserve unrelated or legacy browser data rather than deleting it as cleanup.

### Group

Supabase is authoritative for membership, immutable round decks, unique participant/movie responses, shortlist revisions, round state, controller, expiry, and final selection. Presence indicates connectivity; it does not replace durable membership. Realtime events notify clients to reconcile with authoritative state.

Recommended access mechanism: Supabase anonymous authentication behind the guest interface, with membership-based authorization and controlled database functions for transitions. This is a proposed backend mechanism, not permission to enable it remotely. Anonymous auth configuration, free-tier conditions, and cleanup of unused guest identities must be assessed before choosing final SQL policies. No browser service-role key.

Plan migration changes against the verified live schema. Retain existing columns during transition where possible. Use atomic participant capacity checks and authorized, idempotent response writes. No global open-table grants as a shortcut.

### Recovery and lifecycle

- Store a browser-scoped recovery reference; the database verifies identity/membership, not a caller-supplied UUID alone.
- A disconnected participant can recover for 30 minutes after their last confirmed activity, but never beyond room expiry.
- Rejoining from the same browser restores the same participant and responses, not a duplicate.
- Room expiry is created_at plus 60 minutes, enforced on data operations and transitions. Cleanup may run later without making expired rooms usable.
- Controller transfer uses one atomic claim with a deterministic eligible successor. Explicit departure transfers immediately; transient network loss uses a short grace period to avoid host flapping.
- Persist round/recommendation revisions to reject stale writes and repeated generation.
- Persist wheel winner, shortlist revision, start time, and duration before notification. The wheel chooses uniformly from the visible shortlist; it is for choosing among acceptable options, not re-running ranking.
- Returning clients derive wheel progress/result from the stored record. Animation completion is not authority to write a different result.

## Acceptance and evaluation

Automated release checks:

- No returned movie violates an active, evidence-backed hard constraint.
- No invalid movie IDs, fabricated metadata, duplicate shortlist IDs, or unsupported reasons.
- Unsure and missing responses do not change preference evidence.
- Equal participant weighting holds when response counts differ.
- Positive seen candidates can appear; previously displayed does not mean excluded from final recommendations.
- A retry does not create a duplicate response or advance twice.
- Two isolated clients recover the same deck, round, shortlist, and winner.
- Ten-participant capacity and late-join boundaries are enforced server-side.
- Thirty-minute recovery and one-hour expiry boundaries are tested with controlled clocks.
- Free-only routing and AI-attempt limits hold under failures.

Recommendation quality:

Create at least 20 deterministic scenarios covering nuanced moods, Hindi/English choices, sparse evidence, all unsure, all negative, opposed group preferences, rewatches, restrictive filters, and AI failure. Use these for mechanical correctness, not subjective proof of quality.

Then evaluate at least 10 human-reviewed sessions against ordinary filtered recommendations. Initial target: at least three of five suggestions fit the stated intent in eight of ten sessions, with no hard-constraint violation or fabricated rationale. Record the user's judgments and whether refinement improved the shortlist. This is a proposed acceptance target, not a current result.

## Out of scope

Permanent accounts or viewing profiles; a cross-session watchlist; streaming playback; provider-subscription filtering; dubbed-language guarantees; catalogue-wide model training; per-card model calls; paid AI; Google ratings without a verified free source; a visual redesign before inspirations; publishing during planning.
