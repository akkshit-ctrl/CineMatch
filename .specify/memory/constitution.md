<!--
Sync Impact Report:
- Version change: 0.0.0 -> 1.0.0
- List of modified principles:
  - Added: I. Real-Time Synchronization
  - Added: II. Democratic Selection Logic
  - Added: III. Cinematic & Mobile-First UI
  - Added: IV. AI-Augmented Discovery
  - Added: V. Performance & Simplicity
- Added sections: Technology Stack, Development Workflow
- Templates requiring updates: None (templates are dynamic placeholders)
-->

# CineMatch Constitution

## Core Principles

### I. Real-Time Synchronization
All shared state (rooms, votes, wheel spins) MUST be managed via Supabase Realtime. The experience relies on instant feedback; latency must be minimized to ensure a seamless group experience.

### II. Democratic Selection Logic
A "Match" is defined by a majority rule (51%+) of active room participants, not unanimity. This ensures the game proceeds even with divergent tastes, preventing deadlocks in group decision-making.

### III. Cinematic & Mobile-First UI
The interface MUST be mobile-first, dark-themed, and utilize `shadcn/ui` components. Visuals should evoke a cinematic feel (posters, immersive backgrounds) to set the mood for movie watching.

### IV. AI-Augmented Discovery
Solo mode relies on AI to generate tailored sub-genres and recommendations. The AI acts as a curator, not just a search engine, providing "smart options" that guide the user rather than overwhelming them.

### V. Performance & Simplicity
The application MUST be lightweight and responsive. Avoid heavy client-side processing that hinders the mobile experience. The "room" system uses temporary codes and requires no login to minimize friction.

## Technology Stack

**Frontend**: Next.js (React)
**Styling**: Tailwind CSS + shadcn/ui
**Backend/Realtime**: Supabase
**Data**: TMDB API
**AI**: OpenAI API (or compatible)

## Development Workflow

- Feature branches must follow the `[###-feature-name]` convention.
- All features must be specified in `specs/` before implementation.
- User stories must be prioritized (P1, P2, etc.) to ensure MVP delivery.
- Code reviews must verify compliance with the "Cinematic Experience" and "Real-Time" principles.

## Governance

This constitution governs all architectural and design decisions for CineMatch.
Amendments require a version bump and a Sync Impact Report.
All PRs and reviews must verify compliance with the Core Principles, particularly the Real-Time and UI mandates.

**Version**: 1.0.0 | **Ratified**: 2025-12-24 | **Last Amended**: 2025-12-24
