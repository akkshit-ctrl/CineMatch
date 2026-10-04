# CineMatch Phase 1 goal handoff

Prepared: 2026-10-04, Asia/Calcutta. Select **GPT-6 Luna** and **xhigh** in the Codex model controls before starting. The prompt does not change those controls.

## Activation prompt

Copy this into a local Codex task that can access the existing checkout:

```text
/goal Complete and verify Phase 1 stabilization of CineMatch in C:/Users/Akkshit/vibe_code/movie_chooser. Read and follow C:/Users/Akkshit/vibe_code/movie_chooser/specs/002-session-recommendations/PHASE_1_GOAL_PROMPT.md, including its referenced plans, execution authorization, boundaries, skills, delegation rules, and completion criteria. This authorizes Phase 1 local implementation and verification; continue through fixes and required checks, then stop before Phase 2. Preserve existing user work. Do not commit, push, merge, create a PR, deploy, change remote services, or spend money. Use up to two subagents only when independent tasks benefit, with one coordinator owning shared files and final verification. Complete only with recorded evidence; if a required check is blocked, finish independent authorized work and report the evidence and smallest action needed to unblock it.
```

## Objective and authorization

Implement the approved Phase 1 plan, rather than producing another plan. Restore a dependable local build, navigation, genre loading, name-gated room actions, and successive swipes. Patch relevant framework vulnerabilities within the compatible dependency scope, isolate browser checks from remote services, and leave an accurate execution checkpoint.

The user authorizes local Phase 1 edits, regression tests, compatible dependency changes specified by Task 6, and the required local verification. Do not ask again for routine authorized steps. Ask only when new information materially changes scope, data, cost, security, or an action needs separate authorization. If a skill suggests commits, deployment, or expanding the phase, these explicit boundaries take precedence.

Use the existing checkout. All project edits and project commands belong in:

`C:/Users/Akkshit/vibe_code/movie_chooser`

Applicable parent/repository instructions and installed skills may be read outside this directory. Do not edit sibling projects, global configuration, skills, or memory. Preserve existing tracked and untracked user work; do not reset, clean, stash, or discard it. Do not create a new checkout outside the permitted project boundary.

## Read first

Read applicable AGENTS.md instructions, then these files in order:

1. `C:/Users/Akkshit/vibe_code/movie_chooser/specs/002-session-recommendations/README.md`
2. `C:/Users/Akkshit/vibe_code/movie_chooser/specs/002-session-recommendations/PRODUCT_DESIGN.md`
3. `C:/Users/Akkshit/vibe_code/movie_chooser/specs/002-session-recommendations/RESEARCH_AND_BASELINE.md`
4. `C:/Users/Akkshit/vibe_code/movie_chooser/specs/002-session-recommendations/PHASED_IMPLEMENTATION_PLAN.md`
5. `C:/Users/Akkshit/vibe_code/movie_chooser/specs/002-session-recommendations/PHASE_1_STABILIZATION_PLAN.md`

The new product design records accepted user decisions. The old `specs/001-cinematch-mvp/spec.md` is historical context when needed; it does not override newer decisions. The phased plan covers six phases, but only Phase 1 is the detailed execution slice for this goal.

The Phase 1 document contains proposed code and test examples. They were syntax-parsed during planning, not executed or validated against the application. Inspect current source and reproduce each issue. Adapt examples to actual behavior and types; do not copy them blindly or weaken assertions to get a pass. Refresh affected evidence when it has drifted instead of repeating the whole project audit.

## Skills

Read relevant skills when applying them, announce their use, and follow the available current versions. Known locations:

- Engineering workflow: `C:/Users/Akkshit/.agents/skills/personal-engineering-workflow/SKILL.md`
- Plan execution: `C:/Users/Akkshit/vibe_code/.agents/skills/executing-plans/SKILL.md`
- Debugging: `C:/Users/Akkshit/vibe_code/.agents/skills/systematic-debugging/SKILL.md`
- Regression development: `C:/Users/Akkshit/vibe_code/.agents/skills/test-driven-development/SKILL.md`
- Completion verification: `C:/Users/Akkshit/vibe_code/.agents/skills/verification-before-completion/SKILL.md`
- Browser verification: `C:/Users/Akkshit/.codex/plugins/cache/openai-curated-remote/build-web-apps/0.1.2/skills/frontend-testing-debugging/SKILL.md`
- If delegating: `C:/Users/Akkshit/vibe_code/.agents/skills/dispatching-parallel-agents/SKILL.md`
- If inspecting Supabase: `C:/Users/Akkshit/.agents/skills/supabase/SKILL.md`
- If OpenAI product/tool guidance is needed: `C:/Users/Akkshit/.codex/skills/.system/openai-docs/SKILL.md`

If a skill path changed, resolve its installed equivalent through the available skill catalog. Do not install new plugins, agent frameworks, or skills for this goal. The design is already approved; do not restart broad brainstorming or require another product questionnaire.

## Recorded baseline; verify before relying on it

At prompt preparation, Git reported branch `001-cinematch-mvp`, HEAD `83d4577ff42f122d5180d767133def5c62408ad2`, and an untracked `specs/002-session-recommendations/` directory. Those planning files are intentional user work.

Earlier audit evidence, not fresh results from this prompt preparation:

- 15 unit test files, 107 passing tests; lint had zero errors and five warnings.
- Production build reached compilation/type checking, then failed prerendering `/room` because navigation accessed `window` during rendering.
- Next.js and eslint-config-next were both 16.1.1. Audit reported 23 total advisories and five production advisories, including a critical Next.js issue.
- Package version 16.3.8 for the matching Next.js pair was confirmed during planning. It is a candidate, not a permanent assertion of the latest safe version. Recheck official Next.js advisories and registry compatibility before selecting the smallest suitable update within the existing major version.
- The GitHub-linked Vercel project had a failed deployment at the recorded main commit. The exact remote failure cause and currently served production alias were not established.
- Live Supabase differs from local SQL: a vote uniqueness index exists remotely, the voting RPC uses plain insert, direct anonymous table privileges were missing, and the observed cleanup policy was 24 hours. Seven live migration records differ from the single consolidated local migration.

Do not describe those remote findings as fixed. Mocked UI tests do not prove live room creation, voting, or realtime synchronization. GitHub/Vercel linkage does not establish automatic Supabase migration application.

## Phase 1 tasks and file ownership

Execute Tasks 1–8 from PHASE_1_STABILIZATION_PLAN.md. Relevant files below are relative to the project root specified above; inspect adjacent call sites only when they materially affect the task.

1. Establish Git and test/build baselines. Read `package.json`, `package-lock.json`, and `supabase/migrations/001_initial_schema.sql`. Create `specs/002-session-recommendations/PHASE_1_CHECKPOINT.md` with the actual starting state, evidence, decisions, outstanding work, and remote limitations.
2. Fix server rendering and implement the approved Solo/Group navigation in `src/components/bottom-nav.tsx`. Add `src/components/__tests__/bottom-nav.test.tsx`. Prove rendering without browser globals and exactly one active mode on the supported routes; preserve current styling.
3. Correct genre loading in `src/app/room/page.tsx` and add `src/app/room/__tests__/page.test.tsx`. Preserve the successful bare-array contract of `src/app/api/tmdb/genres/route.ts` and its existing test `src/app/__tests__/api/tmdb/genres.test.ts`. Handle loading failures, invalid responses, stale requests, and unmounts meaningfully.
4. In that same room page, retain the pending create/join action across the name prompt and resume it exactly once. Cover create/join, trimmed names, cancellation, and duplicate/in-flight submission. Make the focused accessibility change in `src/components/name-prompt-modal.tsx`. Do not broaden into a complete modal redesign.
5. Fix motion reset and stale animation handling in `src/components/swipe-deck.tsx`. Add `src/components/__tests__/swipe-deck.motion.test.tsx` and adjust the existing `swipe-deck.test.tsx` mock only as necessary. Prove a successive card returns onscreen and stale animation completion cannot vote after replacement/unmount.
6. Make a controlled advisory-driven dependency patch in `package.json` and `package-lock.json`. Keep Next.js and eslint-config-next compatible and aligned. No force audit fixes, unrelated major upgrades, provider SDK additions, or wholesale lockfile churn. Record remaining advisories and why they are outside this phase if applicable.
7. Isolate `playwright.config.ts` and replace the obsolete `e2e/smoke.spec.ts` cases with the planned provider/database fixtures. Use `127.0.0.1:3117`, a dedicated server, one worker, and no reuse of unrelated running servers. Mock local provider endpoints and Supabase REST/RPC traffic; close Supabase realtime WebSockets and block unexpected external requests. Verify direct room loading, genre display, mode navigation, and consecutive left/right gesture geometry in a mobile viewport. Do not run the old suite against real services before isolating it.
8. Run the final gates sequentially, inspect all changed/new files, and update the checkpoint and roadmap checkboxes only for verified work. Stop at Phase 1.

## Delegation and execution discipline

The user explicitly permits useful parallel/subagent work. Use native Codex subagents, not a new orchestration framework. Keep at most two child agents active, inheriting the selected GPT-6 Luna/xhigh configuration. Do not recursively delegate.

After the coordinator establishes the baseline, suitable independent assignments are:

- Agent A: navigation component and its SSR regression test only (Task 2).
- Agent B: swipe component and its focused regression tests only (Task 5).

Delegate only when this division saves meaningful time or improves review quality. Otherwise execute sequentially; a bounded read-only review is also useful. Give each child explicit files, behavior, tests, shared-state boundaries, and expected output. Each returns root cause, changed files, observed focused test results, and remaining concerns. Agents must not edit each other's files, install dependencies, run broad suites/builds/browser servers, or perform Git/remote mutations.

The coordinator exclusively owns the room page/name flow, dependency manifests/lockfile, Playwright config/suite, execution checkpoint, roadmap updates, integration, and final checks. Do not delegate Tasks 3 and 4 to different concurrent writers because they share the room page. Coordinate focused tests around dependency installation and shared generated outputs. Wait for agents, inspect their diffs, and verify integrated behavior; an agent's report is not sufficient completion evidence.

Use evidence-driven iteration: reproduce, add a meaningful failing regression, apply the smallest robust fix, run the focused check, and record the result. Batch independent reads, keep dependent edits and shared verification sequential, and avoid unnecessary full-suite repetition. Continue from the latest checkpoint after interruptions or compaction.

## Safety and phase boundaries

- No commit, push, merge, PR, deployment, publication, or remote configuration change. Pushing may automatically deploy through Vercel.
- No Supabase migration, grants/RLS/RPC edits, live room/vote writes, cron changes, or remote data cleanup. Read-only metadata inspection is allowed only when relevant and the intended project is established.
- Do not print or copy secrets or environment values into prompts, logs, screenshots, or checkpoints. Preserve existing environment files. Use mock providers; do not call paid models or add credit purchases/paid fallbacks.
- No Phase 2–6 implementation: new recommendation logic, Unsure/seen responses, family/runtime/date filters, authentication, new expiry behavior, group voting redesign, permanent history changes, or visual redesign. The approved Solo/Group navigation is explicitly part of Phase 1.
- Preserve current functional contracts unless the Phase 1 plan expressly changes them. Document broader findings for their later phase.
- Do not delete documents, reorganize unrelated files, or purge saved movie/history data during stabilization.
- If a test port is occupied, choose and record an isolated replacement consistently; do not kill unrelated processes. Stop only servers this task started.
- If browser binaries are unavailable, follow the plan's environment limitation rule: record the blocker rather than installing new dependencies or claiming browser verification.

## Completion evidence

Run from the project root, sequentially, recording exit statuses and concise actionable output:

```powershell
npm test
npm run lint
npm run build
npm exec --no -- playwright test e2e/smoke.spec.ts
npm audit --omit=dev
git diff --check
git diff --stat
git status --short
```

Required completion: scoped regressions and the unit suite pass; lint has no new errors; production build completes; isolated browser smoke checks pass; the scoped vulnerable framework is patched to a suitable compatible version; remaining audit findings are explicitly assessed and recorded; the diff has no whitespace errors, secrets, unintended changes, or weakened valid tests; the checkpoint reflects actual results. Inspect untracked new files as well as the tracked Git diff.

An audit nonzero exit is evidence to assess, not something to hide or automatically fix with force. Existing unrelated warnings/advisories may be documented without widening this goal, but unresolved Phase 1 regressions, required runtime checks, or the scoped framework vulnerability prevent a complete claim. Passing mocks does not remove the recorded live backend limitations.

If a required gate cannot run or a safe solution needs out-of-scope authorization, finish independent authorized work, preserve the checkpoint, report attempted paths and evidence, and ask only for the smallest missing input/action. Do not mark the goal complete because time, context, or budget is low. Respect the goal lifecycle rules supplied by Codex.

Final response: summarize behavior changed and root causes, link changed files and the checkpoint, report actual checks/results and remaining limitations, confirm the work is uncommitted and Phase 2 has not started. Do not claim production readiness or live Supabase correctness from this local phase.

## Official guidance used for this handoff

- [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex): define a measurable outcome, verification, constraints, boundaries, iteration policy, and blocker reporting.
- [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents): explicitly authorize bounded delegation, limit shared writes, and have the coordinator collect/review results.
- [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna): the requested model supports xhigh reasoning. Select the model and effort in the client controls.
