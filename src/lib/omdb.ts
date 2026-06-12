import { OMDBRatings } from '@/types'

const OMDB_BASE = 'https://www.omdbapi.com'

function requireApiKey(): string {
  const key = process.env.OMDB_API_KEY
  if (!key) throw new Error('Missing OMDB_API_KEY environment variable')
  return key
}

interface OMDBResponse {
  imdbID: string
  imdbRating: string
  Ratings: { Source: string; Value: string }[]
  Error?: string
}

function extractRating(ratings: { Source: string; Value: string }[], source: string): string | null {
  const entry = ratings.find((r) => r.Source === source)
  return entry?.Value ?? null
}

export async function getRatingsByImdbId(imdbId: string): Promise<OMDBRatings | null> {
  try {
    const apiKey = requireApiKey()

    const res = await fetch(`${OMDB_BASE}/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}`)

    if (!res.ok) return null

    const data: OMDBResponse = await res.json()

    if (data.Error) return null

    return {
      imdb: data.imdbRating || '',
      rt: extractRating(data.Ratings, 'Rotten Tomatoes') || '',
      metacritic: extractRating(data.Ratings, 'Metacritic') || '',
    }
  } catch {
    return null
  }
}
