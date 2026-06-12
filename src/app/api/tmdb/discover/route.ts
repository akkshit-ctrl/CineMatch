import { NextResponse } from 'next/server'
import { tmdb, TMDBDiscoverParams } from '@/lib/tmdb'

const ALLOWED_PARAMS = new Set([
  'with_genres',
  'with_keywords',
  'primary_release_date.gte',
  'primary_release_date.lte',
  'sort_by',
  'page',
])

const KEYWORD_STRING_RE = /^[a-zA-Z]/ // starts with a letter = keyword text, not IDs

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const params: TMDBDiscoverParams = {}
  for (const [key, value] of searchParams) {
    if (ALLOWED_PARAMS.has(key) && value) {
      if (key === 'page') {
        const page = Number(value)
        if (Number.isFinite(page) && page > 0) {
          params.page = page
        }
      } else if (key === 'with_keywords' && KEYWORD_STRING_RE.test(value)) {
        const keywords = value.split(',').map((s) => s.trim()).filter(Boolean)
        const resolved = await tmdb.resolveKeywords(keywords)
        if (resolved) {
          params.with_keywords = resolved
        }
      } else {
        (params as Record<string, string>)[key] = value
      }
    }
  }

  if (!params.sort_by) {
    params.sort_by = 'popularity.desc'
  }

  try {
    const movies = await tmdb.discover(params)
    return NextResponse.json(movies)
  } catch (error) {
    console.error('TMDB Proxy Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movies from TMDB' },
      { status: 500 }
    )
  }
}
