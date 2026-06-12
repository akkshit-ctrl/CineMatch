# Feature Specification: CineMatch MVP

**Feature Branch**: `001-cinematch-mvp`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "Create a spec for CineMatch. Include: Room schema, AI Solo Filter, Wheel Logic"

## User Scenarios & Testing

### User Story 1 - Solo AI Discovery (Priority: P1)

As a user who doesn't know what to watch, I want to describe my "vibe" to an AI so that I get recommendations that match my specific mood rather than just a generic genre.

**Why this priority**: This is the core value proposition for single users and differentiates the app from basic movie databases.

**Independent Test**: Can be tested by entering a complex mood (e.g., "sad but hopeful 90s drama") and verifying the returned movies match that criteria.

**Acceptance Scenarios**:

1. **Given** the user selects "Drama" and types "courtroom tension", **When** they submit, **Then** the system queries the AI to generate filter parameters (keywords: courtroom, lawyer) and displays relevant results.
2. **Given** the AI cannot find specific keywords, **When** it processes the prompt, **Then** it falls back to the most relevant sub-genre or popular movies in the main genre.

---

### User Story 2 - Group Room Creation & Joining (Priority: P1)

As a group host, I want to create a temporary room and share a code so that my friends can join without creating accounts.

**Why this priority**: Essential for the group functionality; without rooms, there is no group matching.

**Independent Test**: Create a room on one device, join with the code on another device.

**Acceptance Scenarios**:

1. **Given** a host clicks "Start Group Session", **When** the room is created, **Then** a unique alphanumeric code is displayed and the status is "lobby".
2. **Given** a guest enters a valid room code, **When** they join, **Then** they appear in the participant list on the host's screen.

---

### User Story 3 - Synchronized Swiping (Priority: P1)

As a group participant, I want to swipe on the same set of movies as my friends so that we can find common interests.

**Why this priority**: The core mechanic of the "Tinder for Movies" feature.

**Independent Test**: Two users in a room see the same Movie A. User 1 swipes right. User 2 swipes right. Movie A is added to the match pool.

**Acceptance Scenarios**:

1. **Given** the host starts the swiping phase, **When** the status changes to "swiping", **Then** all devices fetch the same movie list based on the host's filters.
2. **Given** a movie appears, **When** a user swipes right, **Then** their vote is recorded in the system.
3. **Given** a movie receives 51% or more right swipes, **When** the voting concludes for that card, **Then** it is added to the `match_pool`.

---

### User Story 4 - The Wheel Decision (Priority: P2)

As a group, we want a fair and exciting way to pick the final movie from our matches so that the decision is made for us.

**Why this priority**: Resolves the "we have 5 matches, now what?" deadlock.

**Independent Test**: Manually populate a match pool, trigger the spin event, verify all clients land on the same result.

**Acceptance Scenarios**:

1. **Given** the match pool has at least one movie, **When** the host clicks "Spin", **Then** a `SPIN_START` event is broadcast with the winning movie ID and a seed/duration.
2. **Given** the wheel is spinning, **When** it stops, **Then** all clients display the same winning movie at the same time.

## Edge Cases

*   **No Matches Found**: If the deck runs out and no movies have reached the 51% threshold, the system prompts the host to "Load More Movies" or "Lower Threshold".
*   **Host Disconnect**: If the host leaves, the room remains active for the TTL duration; another user can trigger the spin.
*   **Single User Room**: If a user tries to start swiping alone, the system warns them but allows it (for testing or solo use).
*   **API Failure**: If the movie provider is down, the system displays a "Service Unavailable" message and prevents room creation.

## Functional Requirements

### 1. Room Management
*   **Schema**:
    *   `id`: String (Alphanumeric, 4-6 chars, Primary Key)
    *   `host_id`: String (UUID or Session ID)
    *   `status`: Enum (`lobby`, `swiping`, `spinning`, `result`)
    *   `match_pool`: Array<Integer> (List of Movie IDs that met the threshold)
    *   `participants`: JSONB (Array of user objects: `{id, name, is_ready}`)
    *   `tmdb_config`: JSONB (Stores `{ page: 1, genre: 27, seed: 123 }` to ensure identical decks)
*   **Lifecycle**: Rooms are temporary. TTL (Time To Live) of 24 hours or deleted when empty for X minutes.

### 2. AI Solo Filter
*   **Input**: User selected Genre (e.g., "Horror") + User "Vibe" Text (e.g., "Cabin in the woods").
*   **Process**: AI analyzes input to map to movie discovery parameters.
*   **Output (Prompt Template)**:
    ```json
    {
      "primary_genre_id": "27",
      "keywords": ["cabin", "woods", "slasher"],
      "min_year": "1980",
      "max_year": "2000",
      "sort_by": "popularity.desc"
    }
    ```
*   **Fallback**: If AI fails, default to the primary genre sorted by popularity.

### 3. Real-Time Logic
*   **Events**:
    *   `ROOM_UPDATE`: Broadcasts changes to participant list or status.
    *   `VOTE_CAST`: Updates the vote count for the current movie.
    *   `SPIN_START`: Payload `{ winner_id: 12345, duration_ms: 5000, start_time: ISO_TIMESTAMP }`.
*   **Majority Rule**: A match is confirmed when `(positive_votes / total_participants) > 0.5`.

## Success Criteria

1.  **Latency**: Wheel spin start event reaches 95% of clients within 200ms.
2.  **AI Relevance**: 90% of AI-generated queries return at least 5 valid results from the movie provider.
3.  **Concurrency**: System handles 50 active rooms with 5 users each without degradation.
4.  **Usability**: Users can join a room (enter code) in under 10 seconds.

## Technical Constraints & Assumptions

*   **Real-Time Provider**: Must use Supabase Realtime (as per Constitution).
*   **Data Source**: Must use TMDB API (as per Constitution).
*   **AI Provider**: OpenAI API or compatible.
*   **Network**: Users have a stable internet connection.
*   **Auth**: No persistent user accounts required (guest access).

