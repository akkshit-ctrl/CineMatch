# CineMatch session recommendations

Planning checkpoint: 2026-10-04, Asia/Calcutta.

This folder records the product decisions agreed in the project review and the plan for implementing them. Phase 1 local stabilization is implemented and has passed its fresh pre-merge review; later phases remain planning work.

Read in this order:

1. [Product design](PRODUCT_DESIGN.md): accepted behavior, architecture direction, boundaries, and acceptance criteria.
2. [Research and baseline](RESEARCH_AND_BASELINE.md): sources, verified local/remote findings, and limits of the evidence.
3. [Phased implementation plan](PHASED_IMPLEMENTATION_PLAN.md): work packages, file responsibilities, dependencies, and phase gates.
4. [Phase 1 execution plan](PHASE_1_STABILIZATION_PLAN.md): concrete steps and regression examples for the first implementation slice.

To start a local GPT-6 Luna/xhigh goal, use the [Phase 1 goal prompt](PHASE_1_GOAL_PROMPT.md). It includes the activation command, context, skills, optional delegation, verification criteria, and stop boundaries. Creating the handoff does not start implementation.

The original [MVP specification](../001-cinematch-mvp/spec.md) remains historical context. When its behavior differs from the decisions here, the newer user decisions control. In particular, recommendations now favor broad group appeal rather than requiring a fixed majority threshold.

See the [Phase 1 checkpoint](PHASE_1_CHECKPOINT.md) for implementation evidence and the [Phase 1 review](PHASE_1_REVIEW.md) for the merge assessment. Later phases receive detailed execution plans after their prerequisites are verified.

## Execution boundaries

- Work only inside movie_chooser.
- Preserve unrelated changes and existing functionality unless this design explicitly changes it.
- Do not commit, push, merge, create a pull request, publish, change remote configuration, or apply a remote migration without explicit authorization.
- No additional paid services, credit purchases, paid model fallbacks, or automatic upgrades to paid tiers.
- Default verification uses mocked providers and isolated browser sessions. Live AI checks require confirmation that the selected account/project is on a free tier.
- Recheck Git, service state, and provider conditions before execution; the baseline is a dated snapshot.
- Execute one phase at a time, record results, and review the scoped diff before advancing.
