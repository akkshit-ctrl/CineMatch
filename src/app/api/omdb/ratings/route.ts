import { NextRequest, NextResponse } from 'next/server'
import { getRatingsByImdbId } from '@/lib/omdb'

const TMDB_BASE = 'https://api.themoviedb.org/3'

interface TMDBMovieDetail {
  imdb_id: string | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const movieIdParam = searchParams.get('movieId')

  if (!movieIdParam) {
    return NextResponse.json(
      { error: 'movieId query parameter is required' },
      { status: 400 }
    )
  }

  const movieId = Number(movieIdParam)
  if (!Number.isFinite(movieId) || movieId <= 0) {
    return NextResponse.json(
      { error: 'movieId must be a positive integer' },
      { status: 400 }
    )
  }

  const tmdbApiKey = process.env.TMDB_API_KEY
  if (!tmdbApiKey) {
    return NextResponse.json(
      { error: 'Missing TMDB_API_KEY environment variable' },
      { status: 500 }
    )
  }

  try {
    const tmdbRes = await fetch(
      `${TMDB_BASE}/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US`
    )

    if (!tmdbRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch movie from TMDB' },
        { status: tmdbRes.status }
      )
    }

    const movie: TMDBMovieDetail = await tmdbRes.json()

    if (!movie.imdb_id) {
      return NextResponse.json({})
    }

    const ratings = await getRatingsByImdbId(movie.imdb_id)

    if (!ratings) {
      return NextResponse.json({})
    }

    return NextResponse.json(ratings)
  } catch (error) {
    console.error('OMDB Ratings Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}
