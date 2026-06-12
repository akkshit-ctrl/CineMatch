'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Sparkles, RefreshCw, Bookmark } from 'lucide-react'
import GenrePill from '@/components/genre-pill'
import MovieHero from '@/components/movie-hero'
import WatchlistPanel from '@/components/watchlist-panel'
import { Button } from '@/components/ui/button'
import type { Movie, AIRecommendation, OMDBRatings } from '@/types'

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
    (h) => !(h.vibe === entry.vibe && h.genreIds.join(',') === entry.genreIds.join(','))
  )
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [savedMovies, setSavedMovies] = useState<Movie[]>([])
  const [error, setError] = useState('')
  const [fallbackNote, setFallbackNote] = useState('')
  const [searchHistory, setSearchHistory] = useState<SearchEntry[]>([])
  const [aiResult, setAiResult] = useState<AIRecommendation | null>(null)
  const [omdbCache, setOmdbCache] = useState<Record<number, OMDBRatings>>({})
  const [movieGenres, setMovieGenres] = useState<Record<number, string[]>>({})

  const omdbFetching = useRef<Set<number>>(new Set())

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

  const fetchOmdbRatings = useCallback(async (movieId: number) => {
    if (omdbCache[movieId] || omdbFetching.current.has(movieId)) return
    omdbFetching.current.add(movieId)
    try {
      const res = await fetch(`/api/omdb/ratings?movieId=${movieId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.imdb || data.rt) {
          setOmdbCache((prev) => ({ ...prev, [movieId]: data }))
        }
      }
    } catch {
      // non-critical
    }
  }, [omdbCache])

  const fetchOmdbRatingsForMovies = useCallback(async (movieList: Movie[]) => {
    for (const movie of movieList) {
      fetchOmdbRatings(movie.id)
    }
  }, [fetchOmdbRatings])

  const fetchMovieGenres = useCallback(async (movieList: Movie[]) => {
    const genreMap = new Map<number, string>()
    genres.forEach((g) => genreMap.set(g.id, g.name))

    const newMovieGenres: Record<number, string[]> = {}
    if (aiResult?.genre_ids) {
      const names = aiResult.genre_ids
        .map((id) => genreMap.get(id))
        .filter(Boolean) as string[]
      movieList.forEach((movie) => {
        newMovieGenres[movie.id] = names
      })
    }
    setMovieGenres(newMovieGenres)
  }, [genres, aiResult])

  const doSearch = useCallback(
    async (searchVibe: string, searchGenreIds: number[], isRetry?: boolean) => {
      setLoading(true)
      setError('')
      setMovies([])
      setFallbackNote('')
      setCurrentIndex(0)
      setAiResult(null)
      setOmdbCache({})
      setMovieGenres({})

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
          throw new Error(aiData.error || 'AI recommendation failed')
        }

        setAiResult(aiData)

        const tmdbParams = new URLSearchParams({
          with_genres: aiData.genre_ids.join(','),
          'primary_release_date.gte': `${aiData.year_range.min}-01-01`,
          'primary_release_date.lte': `${aiData.year_range.max}-12-31`,
          sort_by: aiData.sort_by,
        })

        const tmdbRes = await fetch(`/api/tmdb/discover?${tmdbParams}`)
        if (!tmdbRes.ok) {
          throw new Error('Failed to fetch movies')
        }

        const tmdbData: Movie[] = await tmdbRes.json()

        if (tmdbData.length === 0) {
          setMovies([])
          setLoading(false)
          setError('No movies found for this vibe. Try different genres or keywords.')
          return
        }

        setMovies(tmdbData.slice(0, 20))
        fetchOmdbRatingsForMovies(tmdbData.slice(0, 20))
        fetchMovieGenres(tmdbData.slice(0, 20))

        saveHistory({ vibe: searchVibe.trim(), genreIds: searchGenreIds })
        setSearchHistory(loadHistory())
      } catch {
        if (!isRetry) {
          const fbParams = new URLSearchParams({ sort_by: 'popularity.desc' })
          if (searchGenreIds.length > 0) fbParams.set('with_genres', searchGenreIds.join(','))
          try {
            const fbRes = await fetch(`/api/tmdb/discover?${fbParams}`)
            if (fbRes.ok) {
              const fbData: Movie[] = await fbRes.json()
              setMovies(fbData.slice(0, 20))
              fetchOmdbRatingsForMovies(fbData.slice(0, 20))
              setFallbackNote(
                'AI recommendations unavailable — showing popular picks instead'
              )
            } else {
              setError('The movie database is currently down.')
            }
          } catch {
            setError('Something went wrong.')
          }
        } else {
          setError('Something went wrong.')
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchOmdbRatingsForMovies, fetchMovieGenres]
  )

  const handleSearch = async () => {
    if (!vibe.trim() && genreIds.length === 0) return
    doSearch(vibe, genreIds)
  }

  const handleSave = (movieId: number) => {
    if (savedIds.has(movieId)) return
    setSavedIds((prev) => new Set(prev).add(movieId))
    const movie = movies.find((m) => m.id === movieId)
    if (movie) {
      setSavedMovies((prev) => [...prev, movie])
    }
  }

  const handleSkip = () => {
    if (currentIndex < movies.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handleRemoveSaved = (movieId: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      next.delete(movieId)
      return next
    })
    setSavedMovies((prev) => prev.filter((m) => m.id !== movieId))
  }

  const handleSelectSaved = (movie: Movie) => {
    const idx = movies.findIndex((m) => m.id === movie.id)
    if (idx !== -1) {
      setCurrentIndex(idx)
    }
  }

  const handleRetry = () => {
    doSearch(vibe, genreIds, true)
  }

  const handleNewSearch = () => {
    setMovies([])
    setCurrentIndex(0)
    setSavedIds(new Set())
    setSavedMovies([])
    setAiResult(null)
    setOmdbCache({})
    setMovieGenres({})
    setError('')
    setFallbackNote('')
  }

  const currentMovie = movies[currentIndex]
  const hasResults = movies.length > 0
  const allCaughtUp = currentIndex >= movies.length - 1 && movies.length > 0
  const selectedGenreNames = genreIds
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[]

  return (
    <div className="container mx-auto max-w-lg px-4 py-8 pb-24">
      <div className="text-center mb-8 space-y-2">
        <h1 className="font-display text-3xl md:text-4xl text-accent-gold tracking-tight">
          CineMatch
        </h1>
        <p className="text-muted-foreground text-sm">
          Find your next watch
        </p>
      </div>

      <div className="space-y-5 mb-8">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
            Genres
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGenreIds([])}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border ${
                genreIds.length === 0
                  ? 'bg-accent-gold/15 text-accent-gold border-accent-gold'
                  : 'bg-transparent text-muted-foreground border-accent-gold/10 hover:border-accent-gold/30 hover:text-foreground'
              }`}
            >
              Any Genre
            </button>
            {genres.map((g) => (
              <GenrePill
                key={g.id}
                name={g.name}
                selected={genreIds.includes(g.id)}
                onClick={() => toggleGenre(g.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Describe the vibe
          </p>
          <textarea
            placeholder="e.g., zombies in space, 90s coming-of-age, slow burn mystery..."
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-elevated border border-accent-gold/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold/50 resize-none transition-shadow"
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || (!vibe.trim() && genreIds.length === 0)}
          variant="gold"
          size="lg"
          className="w-full h-12 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Finding movies...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Discover
            </>
          )}
        </Button>
      </div>

      {selectedGenreNames.length > 0 && !hasResults && (
        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-4">
          <span>Selected:</span>
          {selectedGenreNames.map((name) => (
            <span key={name} className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground">
              {name}
            </span>
          ))}
        </div>
      )}

      {error && !hasResults && (
        <div className="text-center space-y-3 mb-8">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="gold-outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Try Again
          </Button>
        </div>
      )}

      {fallbackNote && (
        <p className="text-xs text-yellow-400/80 text-center mb-4">{fallbackNote}</p>
      )}

      {searchHistory.length > 0 && !hasResults && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Recent searches:</span>
            <button
              onClick={() => { clearHistory(); setSearchHistory([]) }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((entry, i) => (
              <button
                key={`${entry.vibe}-${entry.genreIds.join(',')}-${i}`}
                onClick={() => {
                  setVibe(entry.vibe)
                  setGenreIds(entry.genreIds)
                }}
                className="bg-muted hover:bg-muted/80 text-xs px-3 py-1 rounded-full transition-colors text-muted-foreground"
              >
                {entry.genreIds.length > 0
                  ? `${entry.genreIds.map((id) => genres.find((g) => g.id === id)?.name || id).join(', ')}: ${entry.vibe}`
                  : entry.vibe}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-accent-gold/30 border-t-accent-gold animate-spin" />
            <p className="text-sm text-muted-foreground">Finding your next watch...</p>
          </div>
        </div>
      )}

      {hasResults && currentMovie && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Swipe right to save, left to skip</span>
          </div>

          <MovieHero
            key={currentMovie.id + (savedIds.has(currentMovie.id) ? '-saved' : '')}
            movie={currentMovie}
            omdbRatings={omdbCache[currentMovie.id]}
            genres={movieGenres[currentMovie.id]}
            currentIndex={currentIndex}
            totalCount={movies.length}
            saved={savedIds.has(currentMovie.id)}
            onSave={() => handleSave(currentMovie.id)}
            onSkip={() => handleSkip()}
            onSwipeEnd={() => {}}
          />

          <div className="flex items-center justify-center gap-1.5">
            {movies.map((m, i) => (
              <div
                key={m.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-accent-gold'
                    : savedIds.has(m.id)
                      ? 'w-1.5 bg-accent-gold/40'
                      : i < currentIndex
                        ? 'w-1.5 bg-muted'
                        : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSearch}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              New Search
            </Button>
          </div>

          <WatchlistPanel
            savedMovies={savedMovies}
            onSelect={handleSelectSaved}
            onRemove={handleRemoveSaved}
          />
        </div>
      )}

      {allCaughtUp && !loading && (
        <div className="text-center space-y-4 py-8">
          <p className="text-lg font-display text-foreground">All caught up! ✨</p>
          <p className="text-sm text-muted-foreground">
            {savedMovies.length > 0
              ? `You saved ${savedMovies.length} movie${savedMovies.length > 1 ? 's' : ''}.`
              : 'No movies caught your eye?'}
          </p>
          <Button variant="gold" onClick={handleNewSearch}>
            <Sparkles className="w-4 h-4 mr-2" />
            Discover Again
          </Button>
        </div>
      )}
    </div>
  )
}
