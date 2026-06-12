export interface Movie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  vote_average: number
}

export type RoomStatus = 'lobby' | 'swiping' | 'spinning' | 'result'

export interface Room {
  id: string
  host_id: string
  status: RoomStatus
  genre_id?: number
  match_pool: number[]
  created_at: string
  tmdb_config?: {
    keywords?: string[]
    year_range?: { min: number; max: number }
  }
}

export interface Participant {
  user_id: string
  name: string
  is_host: boolean
  online_at: string
}

export interface AIRecommendation {
  keywords: string[]
  genre_ids: number[]
  year_range: {
    min: number
    max: number
  }
  sort_by: 'popularity.desc' | 'vote_average.desc'
}

export interface OMDBRatings {
  imdb: string
  rt: string
  metacritic: string
}
