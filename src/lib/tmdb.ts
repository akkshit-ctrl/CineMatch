const BASE_URL = 'https://api.themoviedb.org/3'

function requireApiKey(): string {
  const key = process.env.TMDB_API_KEY
  if (!key) throw new Error('Missing TMDB_API_KEY environment variable')
  return key
}

interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
}

export interface TMDBDiscoverParams {
  with_genres?: string
  with_keywords?: string
  'primary_release_date.gte'?: string
  'primary_release_date.lte'?: string
  sort_by?: string
  page?: number
}

interface TMDBKeyword {
  id: number
  name: string
}

export const tmdb = {
  getMovie: async (movieId: number): Promise<TMDBMovie | null> => {
    const apiKey = requireApiKey()

    const res = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US`
    )

    if (!res.ok) return null

    return res.json()
  },

  getMovies: async (movieIds: number[]): Promise<TMDBMovie[]> => {
    const results = await Promise.allSettled(
      movieIds.map((id) => tmdb.getMovie(id))
    )
    return results
      .filter(
        (r): r is PromiseFulfilledResult<TMDBMovie> =>
          r.status === 'fulfilled' && r.value !== null
      )
      .map((r) => r.value)
  },

  discover: async (params: TMDBDiscoverParams): Promise<TMDBMovie[]> => {
    const apiKey = requireApiKey()

    const searchParams = new URLSearchParams({
      api_key: apiKey,
      include_adult: 'false',
      language: 'en-US',
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    })

    const res = await fetch(`${BASE_URL}/discover/movie?${searchParams}`)

    if (!res.ok) {
      throw new Error(`TMDB API Error (${res.status}): ${res.statusText}`)
    }

    const data = await res.json()
    return data.results
  },

  searchKeyword: async (query: string): Promise<TMDBKeyword | null> => {
    const apiKey = requireApiKey()

    const res = await fetch(
      `${BASE_URL}/search/keyword?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US`
    )

    if (!res.ok) return null

    const data = await res.json()
    return data.results?.[0] ?? null
  },

  resolveKeywords: async (keywords: string[]): Promise<string> => {
    const results = await Promise.all(
      keywords.map((keyword) => tmdb.searchKeyword(keyword))
    )
    const ids = results.filter((r): r is NonNullable<typeof r> => r !== null).map((r) => r.id)
    return ids.join(',')
  },
}
