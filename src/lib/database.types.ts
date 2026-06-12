export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      rooms: {
        Row: {
          created_at: string | null
          genre_id: number | null
          host_id: string
          id: string
          match_pool: Json | null
          status: string | null
          tmdb_config: Json | null
        }
        Insert: {
          created_at?: string | null
          genre_id?: number | null
          host_id: string
          id: string
          match_pool?: Json | null
          status?: string | null
          tmdb_config?: Json | null
        }
        Update: {
          created_at?: string | null
          genre_id?: number | null
          host_id?: string
          id?: string
          match_pool?: Json | null
          status?: string | null
          tmdb_config?: Json | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: number
          movie_id: number
          room_id: string | null
          user_id: string
          vote: boolean
        }
        Insert: {
          created_at?: string | null
          id?: never
          movie_id: number
          room_id?: string | null
          user_id: string
          vote: boolean
        }
        Update: {
          created_at?: string | null
          id?: never
          movie_id?: number
          room_id?: string | null
          user_id?: string
          vote?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cast_vote: {
        Args: {
          p_room_id: string
          p_user_id: string
          p_movie_id: number
          p_vote: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
