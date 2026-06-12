'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getRoom, castVoteRpc as castVote, calculateMatchPool, updateRoomStatus, subscribeRoom, getVoteCounts, broadcastVote } from '@/lib/room'
import { getSupabase } from '@/lib/supabase'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import SwipeDeck from '@/components/swipe-deck'
import type { Movie, Room } from '@/types'

export default function SwipePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [roomId, setRoomId] = useState<string | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [noMatches, setNoMatches] = useState(false)
  const [voteProgress, setVoteProgress] = useState<Record<number, { yes: number; no: number }>>({})

  const voteChannelRef = useRef<ReturnType<ReturnType<typeof getSupabase>['channel']> | null>(null)
  const userId = typeof window !== 'undefined'
    ? sessionStorage.getItem('cinematch_user_id')
    : null

  useEffect(() => {
    params.then(({ id }) => setRoomId(id))
  }, [params])

  useEffect(() => {
    if (!roomId) return

    const load = async () => {
      try {
        const roomData = await getRoom(roomId)
        setRoom(roomData)

        const buildDiscoverUrl = () => {
          const params = new URLSearchParams()
          params.set('sort_by', 'popularity.desc')

          if (roomData?.genre_id) {
            params.set('with_genres', String(roomData.genre_id))
          }

          if (roomData?.tmdb_config) {
            const config = roomData.tmdb_config as { keywords?: string[]; year_range?: { min: number; max: number } }
            if (config.keywords?.length) {
              params.set('with_keywords', config.keywords.join(','))
            }
            if (config.year_range) {
              params.set('primary_release_date.gte', `${config.year_range.min}-01-01`)
              params.set('primary_release_date.lte', `${config.year_range.max}-12-31`)
            }
          }

          if (!params.has('with_genres') && !params.has('with_keywords')) {
            params.set('page', String(Math.floor(Math.random() * 10) + 1))
          }

          return `/api/tmdb/discover?${params.toString()}`
        }

        const res = await fetch(buildDiscoverUrl())
        if (!res.ok) throw new Error('Failed to fetch movies')
        const data: Movie[] = await res.json()
        setMovies(data.slice(0, 20))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movies')
      } finally {
        setLoading(false)
      }
    }

    load()

    const unsubscribe = subscribeRoom(roomId, (updated) => {
      setRoom(updated)
      if (updated.status === 'spinning') {
        router.push(`/room/${roomId}/spin`)
      }
    })

    return unsubscribe
  }, [roomId, router])

  const allVoted = votedIds.size >= movies.length && movies.length > 0
  const current = movies[currentIndex]
  const isHost = room ? userId === room.host_id : false
  const remaining = movies.length - currentIndex
  const currentProgress = current ? voteProgress[current.id] ?? { yes: 0, no: 0 } : { yes: 0, no: 0 }

  useEffect(() => {
    if (!roomId || !movies[currentIndex] || allVoted) return
    const movieId = movies[currentIndex].id
    getVoteCounts(roomId, movieId).then((counts) => {
      setVoteProgress((prev) => ({
        ...prev,
        [movieId]: { yes: counts.yes, no: counts.no },
      }))
    })
  }, [roomId, currentIndex, movies, allVoted])

  useEffect(() => {
    if (!roomId) return

    const supabase = getSupabase()
    const sharedChannel = supabase.channel(`room-votes:${roomId}`)

    sharedChannel.on(
      'broadcast',
      { event: 'VOTE_CAST' },
      (payload) => {
        const { movie_id, vote } = payload.payload as { movie_id: number; vote: boolean }
        setVoteProgress((prev) => {
          const current = prev[movie_id] ?? { yes: 0, no: 0 }
          return {
            ...prev,
            [movie_id]: {
              yes: current.yes + (vote ? 1 : 0),
              no: current.no + (vote ? 0 : 1),
            },
          }
        })
      }
    )
    sharedChannel.subscribe()
    voteChannelRef.current = sharedChannel

    return () => {
      voteChannelRef.current = null
      sharedChannel.unsubscribe()
    }
  }, [roomId])

  const handleVote = useCallback(async (movieId: number, vote: boolean) => {
    if (!roomId || !userId || voting) return

    setVoting(true)
    try {
      await castVote(roomId, userId, movieId, vote)
      await broadcastVote(roomId, movieId, userId, vote, voteChannelRef.current ?? undefined)
      setVotedIds((prev) => new Set(prev).add(movieId))
      if (currentIndex < movies.length - 1) {
        setCurrentIndex((i) => i + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast vote')
    } finally {
      setVoting(false)
    }
  }, [roomId, userId, voting, currentIndex, movies.length])

  const handleSwipeLeft = useCallback((movieId: number) => {
    handleVote(movieId, false)
  }, [handleVote])

  const handleSwipeRight = useCallback((movieId: number) => {
    handleVote(movieId, true)
  }, [handleVote])

  const handleFinish = async () => {
    if (!roomId) return
    setCalculating(true)
    setNoMatches(false)
    try {
      const pool = await calculateMatchPool(roomId)
      if (pool.length > 0) {
        await updateRoomStatus(roomId, 'spinning')
        router.push(`/room/${roomId}/spin`)
      } else {
        setNoMatches(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate matches')
    } finally {
      setCalculating(false)
    }
  }

  const handleLowerThreshold = async () => {
    if (!roomId) return
    setCalculating(true)
    try {
      const pool = await calculateMatchPool(roomId, 0.4)
      if (pool.length > 0) {
        await updateRoomStatus(roomId, 'spinning')
        router.push(`/room/${roomId}/spin`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate')
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12 text-center space-y-4">
        <p className="text-red-400">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-display text-accent-gold">Swipe & Vote</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allVoted
            ? 'You\'ve voted on all movies!'
            : `${remaining} movie${remaining !== 1 ? 's' : ''} remaining`
          }
        </p>
      </div>

      <div className="relative aspect-[2/3] mb-6">
        {current && !allVoted ? (
          <SwipeDeck
            movies={movies}
            currentIndex={currentIndex}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        ) : allVoted ? (
          <div className="w-full h-full rounded-lg bg-surface border border-accent-gold/10 flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">All Done!</h2>
            <p className="text-muted-foreground mb-6">
              {isHost
                ? 'Ready to see the matches?'
                : 'Waiting for the host to finish...'
              }
            </p>
            {isHost ? (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleFinish}
                  disabled={calculating}
                  variant="gold"
                  size="lg"
                  className="text-lg px-8"
                >
                  {calculating ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  See Matches
                </Button>
                {noMatches && (
                  <Button
                    onClick={handleLowerThreshold}
                    variant="gold-outline"
                    size="sm"
                    disabled={calculating}
                  >
                    {calculating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Lower Threshold
                  </Button>
                )}
                <Button
                  onClick={() => window.location.reload()}
                  variant="gold-outline"
                  size="sm"
                >
                  Load More Movies
                </Button>
              </div>
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
            )}
          </div>
        ) : null}
      </div>

      {current && !allVoted && (
        <>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
              onClick={() => handleVote(current.id, false)}
              disabled={voting}
              aria-label="Vote no"
            >
              <ThumbsDown className="w-5 h-5 text-red-400" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-success/50 hover:bg-success/10 hover:border-success"
              onClick={() => handleVote(current.id, true)}
              disabled={voting}
              aria-label="Vote yes"
            >
              <ThumbsUp className="w-5 h-5 text-green-400" />
            </Button>
          </div>

          <div className="mt-4 px-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-400 min-w-[3ch] text-right">{currentProgress.yes} yes</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                {currentProgress.yes + currentProgress.no > 0 && (
                  <div className="flex h-full">
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{ width: `${(currentProgress.yes / (currentProgress.yes + currentProgress.no)) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all duration-300"
                      style={{ width: `${(currentProgress.no / (currentProgress.yes + currentProgress.no)) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-red-400 min-w-[3ch]">{currentProgress.no} no</span>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-1 mt-6">
        {movies.slice(0, Math.min(movies.length, 20)).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-6 bg-accent-gold'
                : votedIds.has(movies[i].id)
                  ? 'w-1.5 bg-accent-gold/40'
                  : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
