import { NextResponse } from 'next/server'

interface TMDBGenre {
  id: number
  name: string
}

let cachedGenres: TMDBGenre[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing TMDB_API_KEY' }, { status: 500 })
  }

  if (cachedGenres && Date.now() - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedGenres)
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`
    )
    if (!res.ok) {
      throw new Error(`TMDB API Error (${res.status}): ${res.statusText}`)
    }
    const data = await res.json()
    cachedGenres = data.genres as TMDBGenre[]
    cacheTimestamp = Date.now()
    return NextResponse.json(cachedGenres)
  } catch (error) {
    console.error('TMDB Genres Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genres from TMDB' },
      { status: 500 }
    )
  }
}
