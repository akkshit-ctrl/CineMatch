import { NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'

function requireApiKey(): string {
  const key = process.env.TMDB_API_KEY
  if (!key) throw new Error('Missing TMDB_API_KEY environment variable')
  return key
}

interface WatchProvider {
  provider_name: string
  logo_path: string
  display_priority: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('movieId')

  if (!movieId) {
    return NextResponse.json(
      { error: 'movieId query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const apiKey = requireApiKey()
    const res = await fetch(
      `${TMDB_BASE}/movie/${movieId}/watch/providers?api_key=${apiKey}`
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch watch providers' },
        { status: res.status }
      )
    }

    const data = await res.json()
    const results = data.results ?? {}

    const regions = ['US', 'CA', 'GB', 'AU']
    let providers: WatchProvider[] = []

    for (const region of regions) {
      if (results[region]?.flatrate) {
        providers = results[region].flatrate
        break
      }
    }

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('TMDB Watch Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watch providers' },
      { status: 500 }
    )
  }
}
