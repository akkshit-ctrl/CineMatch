# CineMatch research and verified baseline

Snapshot: 2026-10-04. Research and service inspection were read-only.

## Evidence boundaries

The earlier audit exercised local pages using mocked movie services, blocked external browser calls, and isolated browser sessions. It did not prove live multi-device room behavior or AI taste quality.

The planning follow-up inspected linked project metadata and Supabase schema/access metadata. It did not mutate rows, run DDL, apply migrations, create accounts, deploy, or make AI inference requests.

Recheck drift-prone facts before implementing, especially quotas, account billing tier, model availability, deployment state, grants, and schema.

## Local project

- Repository: [akkshit-ctrl/CineMatch](https://github.com/akkshit-ctrl/CineMatch).
- Current local branch at inspection: 001-cinematch-mvp.
- Commit: 83d4577ff42f122d5180d767133def5c62408ad2, build_0.
- Git was clean before planning documents.
- Stack: Next.js 16.1.1, React 19.2.3, TypeScript, Tailwind 4, Supabase JS 2.108.1, Framer Motion, Vitest, Playwright.
- Existing model integration: Gemini 2.5 Flash through Google's OpenAI-compatible endpoint; the OpenAI SDK package name does not mean the application currently uses an OpenAI-hosted model.

Prior audit results, not rerun for documentation creation:

| Check | Observed result |
| --- | --- |
| Unit/render/API tests | 15 files, 107 passing tests. |
| Lint | Zero errors, five warnings, including generated coverage and test-image mocks. |
| Production build | Compilation/type checking succeeded; /room prerender failed because BottomNav reads window during render. |
| Browser checks | Reproduced missing room genres, interrupted create/join after name entry, premature solo completion, repeated-search ratings loss, dark synopsis text, and the next group swipe card remaining offscreen. |
| Dependency audit | 23 affected packages overall; five in production dependency scope, including critical Next.js findings. Re-audit before changes. |
| Existing E2E suite | Stale UI assumptions and potential remote writes; old generated passed state is not current verification. |

Package registry reads during planning confirmed next@16.3.8 and eslint-config-next@16.3.8 exist. Their suitability and the whole transitive dependency graph still require verification during the upgrade.

## Linked services

### Vercel

Project cine-match is linked to this GitHub repository under the user's Vercel team.

- Latest observed production deployment: ERROR for commit 83d4577ff42f122d5180d767133def5c62408ad2 on main.
- GitHub commit status also reports Vercel failure.
- An older production deployment was READY for commit 98f173ffccf8cf6c6bf4d72d20b8ebc2372f55be.
- These facts establish Git-triggered deployment integration. They do not establish which version is currently served by every production alias or prove the remote build failure has the exact same cause as the local failure.
- [Latest observed deployment inspection](https://vercel.com/akkshit-vibe-codes/cine-match/2pW17ewqSvZNJN9zzFpWiTx6QXPu).

### Supabase

The locally configured project matches Movie_app_test, reported ACTIVE_HEALTHY.

Live public schema includes rooms and votes, both with RLS enabled. Realtime publication includes both tables, and pg_cron is installed.

Important differences and blockers:

- Live votes has a unique index on room_id, user_id, movie_id; the tracked initial migration omits it. The earlier source-only duplicate-vote finding must therefore be refined: live duplicates are constrained, but retries currently use a plain INSERT and can fail instead of being idempotent.
- Live migration history contains seven entries, while the repository only tracks the consolidated initial SQL.
- Multiple overlapping permissive anon RLS policies are present.
- Effective has_table_privilege checks for anon SELECT/INSERT/UPDATE on rooms and votes returned false; authenticated SELECT also returned false. Policy permissiveness alone does not establish table reachability. Direct application table access is a concrete permission concern.
- The live cast_vote function is SECURITY DEFINER and performs a plain INSERT. Function execute rights, caller identity validation, and effective search path require reconciliation before claiming a complete access model.
- The active cleanup-old-rooms job runs every six hours and deletes rooms older than 24 hours. It does not implement the requested one-hour expiry.
- The local abandoned-lobby cleanup job was not returned by the live room-job inspection.

Do not blindly rerun the initial SQL. It creates policies/publication entries that already exist, and it is not a faithful snapshot of live history.

No repository workflow was found that automatically applies Supabase migrations on Git push. The local migration README explicitly describes manual SQL Editor application. Database rollout must have its own verified process.

## Recommendation research

Primary sources:

1. [Netflix: Learning a Personalized Homepage](https://netflixtechblog.com/learning-a-personalized-homepage-aa8ec670359a).
2. [Netflix recommendations research](https://research.netflix.com/research-area/recommendations), including the listed publication Augmenting Netflix Search with In-Session Adapted Recommendations.

Netflix's published discussion describes candidate generation, filtering, ranking, deduplication, relevance/diversity trade-offs, and support for discovery and rewatches. Its research index identifies session interactions as a way to address immediate intent.

Application to CineMatch is an engineering inference: retrieve bounded real candidates, use session evidence, rank personal/group fit, and select a diverse shortlist. These sources do not validate CineMatch's proposed weighting, establish AI superiority, or justify training a Netflix-scale model.

Validate quality against a deterministic baseline and human-reviewed examples rather than copying implementation scale.

## Free AI options

### Gemini

[Official pricing](https://ai.google.dev/gemini-api/docs/pricing) lists free input/output access for Gemini 2.5 Flash. Free-tier limits depend on model/project; account billing and current quota have not been verified. Do not infer free billing merely because a model offers a free tier. The source notes free-tier content may be used to improve Google's products.

Recommended first evaluation candidate because the integration already exists. Send only required movie/preferences data; omit identifiers and recovery credentials.

### OpenRouter

[Official pricing](https://openrouter.ai/pricing) lists free models and a 50-request/day free plan. [Free model routing](https://openrouter.ai/openrouter/free) can choose among available free models, which may reduce repeatability.

Prefer a deliberately selected/evaluated free model for stable comparisons. Paid-model routing, paid fallback, automatic top-up, and credit purchase are outside the budget.

### OpenCode Zen

[Official Zen documentation](https://opencode.ai/docs/zen/) provides direct API endpoints and free model entries. It primarily discusses coding-oriented provider evaluation; that does not establish movie recommendation quality. Availability and free-model data-use conditions vary.

Potential experimental candidate, not the default dependency. No OpenCode agent process is needed merely to call a model API.

### Existing ChatGPT subscription

[Official integration guide](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt) and [quickstart](https://developers.openai.com/siwc/quickstart) describe authorized ChatGPT plan usage for eligible personal local/open-source projects and selected private clients. Remotely hosted apps require approved access.

Therefore a supported local experiment may be possible, but hosting the current website on Vercel does not establish entitlement. Do not copy Codex credentials into application environment variables or use undocumented subscription-token forwarding.

## Movie metadata and ratings

- [TMDB discovery](https://developer.themoviedb.org/reference/discover-movie) documents genre OR/AND syntax, original-language filtering, runtime bounds, and release-date bounds.
- [TMDB release dates/certifications](https://developer.themoviedb.org/reference/movie-release-dates) supports retrieving certification information.
- [TMDB watch providers](https://developer.themoviedb.org/reference/movie-watch-providers) returns country-specific provider information and requires JustWatch attribution.
- [OMDb](https://www.omdbapi.com/) is the existing rating source; local parsing handles IMDb, Rotten Tomatoes, and Metacritic fields.
- [OMDb free-key page](https://www.omdbapi.com/apikey.aspx) lists a 1,000-request daily limit. Runtime coverage and account-specific free access were not exhaustively tested.
- No supported free Google movie-rating source was established. The user agreed to omit Google initially.

Fetch optional ratings lazily/boundedly and cache by verified movie/IMDb ID. Missing data is unavailable, never a zero score or an AI-filled value.

Certification is not a complete content advisory. Adult-family preference accuracy needs a bounded source-coverage evaluation. Neither a low age certificate nor include_adult=false proves absence of explicit scenes.

## Outstanding engineering validation

These are implementation research/check gates, not unanswered product questions:

- Free-tier status and quota of the chosen AI account.
- Anonymous guest authorization configuration and identity cleanup.
- Coverage of free family-content evidence for English/Hindi titles.
- A reproducible live-schema baseline and migration rehearsal.
- Group consistency under disconnects and simultaneous controller claims.
- Recommendation quality and usefulness of refinement.
- Current dependency advisory status after patching.
