'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, X } from 'lucide-react'
import { Movie } from '@/types'
import MovieCard from '@/components/movie-card'

const HISTORY_KEY = 'cinematch_search_history'
const MAX_HISTORY = 5

interface Genre {
  id: number
  name: string
}

interface SearchEntry {
  vibe: string
  genreIds: number[]
}

function loadHistory(): SearchEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(entry: SearchEntry) {
  const history = loadHistory()
  const filtered = history.filter(
    (h) => !(h.vibe === entry.vibe && arraysEqual(h.genreIds, entry.genreIds))
  )
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, i) => val === sortedB[i])
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

export default function SoloMode() {
  const [vibe, setVibe] = useState('')
  const [genreIds, setGenreIds] = useState<number[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'ai_error' | 'tmdb_error' | 'generic_error' | null>(null)
  const [fallbackNote, setFallbackNote] = useState('')
  const [searchHistory, setSearchHistory] = useState<SearchEntry[]>([])

  useEffect(() => {
    setSearchHistory(loadHistory())
    fetch('/api/tmdb/genres')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGenres(data)
      })
      .catch(() => {})
  }, [])

  const toggleGenre = (id: number) => {
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  const doSearch = useCallback(
    async (searchVibe: string, searchGenreIds: number[], isRetry?: boolean) => {
      setLoading(true)
      setError('')
      setErrorType(null)
      setMovies([])
      setFallbackNote('')

      try {
        const aiRes = await fetch('/api/ai/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vibe: searchVibe.trim(),
            genre_ids: searchGenreIds.length > 0 ? searchGenreIds : undefined,
          }),
        })

        const aiData = await aiRes.json()

        if (!aiRes.ok || aiData.error) {
          setErrorType('ai_error')
          throw new Error(aiData.error || 'AI recommendation failed')
        }

        const tmdbParams = new URLSearchParams({
          with_genres: aiData.genre_ids.join(','),
          'primary_release_date.gte': `${aiData.year_range.min}-01-01`,
          'primary_release_date.lte': `${aiData.year_range.max}-12-31`,
          sort_by: aiData.sort_by,
        })

        const tmdbRes = await fetch(`/api/tmdb/discover?${tmdbParams}`)
        if (!tmdbRes.ok) {
          setErrorType('tmdb_error')
          throw new Error('Failed to fetch movies')
        }

        const tmdbData = await tmdbRes.json()
        setMovies(tmdbData)

        saveHistory({ vibe: searchVibe.trim(), genreIds: searchGenreIds })
        setSearchHistory(loadHistory())
      } catch {
        if (!isRetry) {
          const fbParams = new URLSearchParams({ sort_by: 'popularity.desc' })
          if (searchGenreIds.length > 0) fbParams.set('with_genres', searchGenreIds.join(','))
          try {
            const fbRes = await fetch(`/api/tmdb/discover?${fbParams}`)
            if (fbRes.ok) {
              const fbData = await fbRes.json()
              setMovies(fbData)
              setFallbackNote(
                'AI recommendations unavailable — showing popular picks instead'
              )
            } else {
              setErrorType('tmdb_error')
              setError('The movie database is currently down.')
            }
          } catch {
            setErrorType('generic_error')
            setError('Something went wrong.')
          }
        } else {
          setError('Something went wrong.')
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vibe.trim()) return
    doSearch(vibe, genreIds)
  }

  const handleChipClick = (entry: SearchEntry) => {
    setVibe(entry.vibe)
    setGenreIds(entry.genreIds)
  }

  const handleClearHistory = () => {
    clearHistory()
    setSearchHistory([])
  }

  const selectedGenreNames = genreIds
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          CineMatch
        </h1>
        <p className="text-muted-foreground text-lg">
          Describe your vibe, find your movie.
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Tell me what you&apos;re in the mood for
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-5">
            <textarea
              placeholder="e.g., '90s sci-fi thriller with a twist' or 'cozy ghibli vibes' or 'something like Inception meets The Matrix'..."
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-input bg-card/50 backdrop-blur-sm px-4 py-3 text-lg ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none transition-shadow shadow-sm focus-visible:shadow-md"
            />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                Filter by genre (optional — pick as many as you like)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={genreIds.length === 0}
                  onClick={() => setGenreIds([])}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    genreIds.length === 0
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  Any Genre
                </button>
                {genres.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="checkbox"
                    aria-checked={genreIds.includes(g.id)}
                    onClick={() => toggleGenre(g.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      genreIds.includes(g.id)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" size="lg" disabled={loading || !vibe.trim()} className="h-13 px-10 text-base font-semibold">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Finding movies...
                  </>
                ) : (
                  'Find Movies'
                )}
              </Button>
              {selectedGenreNames.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>in</span>
                  {selectedGenreNames.map((name) => (
                    <span key={name} className="inline-flex items-center gap-0.5 bg-muted px-2 py-0.5 rounded-full text-xs">
                      {name}
                      <button type="button" onClick={() => {
  const found = genres.find((g) => g.name === name)
  if (found) toggleGenre(found.id)
}}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
          {errorType === 'ai_error' && !fallbackNote && (
            <div className="mt-4 text-sm space-y-2">
              <p className="text-yellow-400">
                Our AI recommendation engine is temporarily unavailable.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => doSearch(vibe, genreIds, true)}
              >
                Try Again
              </Button>
            </div>
          )}
          {errorType === 'tmdb_error' && (
            <div className="mt-4 text-sm space-y-2">
              <p className="text-red-400">The movie database is currently down.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => doSearch(vibe, genreIds, true)}
              >
                Try Again
              </Button>
            </div>
          )}
          {errorType === 'generic_error' && (
            <div className="mt-4 text-sm space-y-2">
              <p className="text-red-400">{error || 'Something went wrong.'}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => doSearch(vibe, genreIds, true)}
              >
                Try Again
              </Button>
            </div>
          )}
          {error && !errorType && <p className="text-red-400 mt-4 text-sm">{error}</p>}
          {fallbackNote && (
            <p className="text-yellow-400 mt-4 text-sm">{fallbackNote}</p>
          )}
        </CardContent>
      </Card>

      {searchHistory.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Recent searches:</span>
            <button
              onClick={handleClearHistory}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear history
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((entry, i) => (
              <button
                key={`${entry.vibe}-${entry.genreIds.join(',')}-${i}`}
                onClick={() => handleChipClick(entry)}
                className="bg-muted hover:bg-muted/80 text-sm px-3 py-1 rounded-full transition-colors"
              >
                {entry.genreIds.length > 0
                  ? `${entry.genreIds.map((id) => genres.find((g) => g.id === id)?.name || id).join(', ')}: ${entry.vibe}`
                  : entry.vibe}
              </button>
            ))}
          </div>
        </div>
      )}

      {movies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  )
}
