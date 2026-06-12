import { NextResponse } from 'next/server'
import { tmdb } from '@/lib/tmdb'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')

  if (!idsParam) {
    return NextResponse.json(
      { error: 'ids query parameter is required (comma-separated)' },
      { status: 400 }
    )
  }

  const ids = idsParam
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No valid movie IDs provided' }, { status: 400 })
  }

  try {
    const movies = await tmdb.getMovies(ids)
    return NextResponse.json(movies)
  } catch (error) {
    console.error('TMDB Movies Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    )
  }
}
