# Data Model: CineMatch MVP

## 1. Database Schema (Supabase / PostgreSQL)

### Table: `rooms`
*Ephemeral storage for active sessions.*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PK | Alphanumeric code (e.g., "ABCD"). |
| `host_id` | `uuid` | Not Null | ID of the user who created the room (anonymous UUID). |
| `status` | `text` | Default 'lobby' | Enum: `lobby`, `swiping`, `spinning`, `result`. |
| `genre_id` | `int` | Nullable | TMDB Genre ID selected by host. |
| `match_pool` | `jsonb` | Default `[]` | Array of Movie IDs that met the 51% threshold. |
| `created_at` | `timestamptz` | Default `now()` | For TTL cleanup (delete after 24h). |

### Table: `votes`
*Tracks individual swipes.*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `room_id` | `text` | FK -> rooms.id | The room this vote belongs to. |
| `user_id` | `uuid` | Not Null | The user who voted. |
| `movie_id` | `int` | Not Null | TMDB Movie ID. |
| `vote` | `boolean` | Not Null | `true` (Right/Like), `false` (Left/Dislike). |
| `created_at` | `timestamptz` | Default `now()` | |

*Note: We use a separate `votes` table instead of a JSON array in `rooms` to handle concurrent writes better and simplify "count" queries.*

## 2. TypeScript Interfaces

### Room State
```typescript
type RoomStatus = 'lobby' | 'swiping' | 'spinning' | 'result';

interface Room {
  id: string;
  host_id: string;
  status: RoomStatus;
  genre_id?: number;
  match_pool: number[]; // Movie IDs
  created_at: string;
}
```

### Participant (Presence)
```typescript
interface Participant {
  user_id: string;
  name: string;
  is_host: boolean;
  online_at: string;
}
```

### AI Response (Internal)
```typescript
interface AIRecommendation {
  keywords: string[];
  genre_ids: number[];
  year_range: {
    min: number;
    max: number;
  };
  sort_by: 'popularity.desc' | 'vote_average.desc';
}
```

### TMDB Movie
```typescript
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
}
```
