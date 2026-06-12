'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Wheel from '@/components/wheel'
import {
  getRoom,
  subscribeRoom,
  subscribeSpinEvent,
  broadcastSpinStart,
  updateRoomStatus,
} from '@/lib/room'
import Image from 'next/image'
import {
  Loader2,
  RotateCw,
  Trophy,
  ArrowLeft,
  Star,
  Monitor,
} from 'lucide-react'
import type { Movie, Room } from '@/types'

export default function SpinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [roomId, setRoomId] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [winnerId, setWinnerId] = useState<number | null>(null)
  const [winner, setWinner] = useState<Movie | null>(null)
  const [spinDuration, setSpinDuration] = useState(5000)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<{ provider_name: string; logo_path: string }[]>([])
  const [providersLoading, setProvidersLoading] = useState(false)

  const userId =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('cinematch_user_id')
      : null

  useEffect(() => {
    params.then(({ id }) => setRoomId(id))
  }, [params])

  const loadRoom = useCallback(async (id: string) => {
    try {
      const data = await getRoom(id)
      if (!data) {
        setError('Room not found')
        return
      }
      setRoom(data)

      if (data.match_pool.length > 0) {
        const res = await fetch(
          `/api/tmdb/movies?ids=${data.match_pool.join(',')}`
        )
        if (res.ok) {
          const movieData: Movie[] = await res.json()
          setMovies(movieData)

          if (data.status === 'result') {
            const firstMatch = movieData[0]
            if (firstMatch) {
              setWinner(firstMatch)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!roomId) return
    loadRoom(roomId)
  }, [roomId, loadRoom])

  useEffect(() => {
    if (!roomId) return

    const unsubRoom = subscribeRoom(roomId, (updated) => {
      setRoom(updated)
      if (updated.status === 'result' && movies.length > 0 && !winner) {
        const firstMatch = movies[0]
        if (firstMatch) setWinner(firstMatch)
      }
    })

    const unsubSpin = subscribeSpinEvent(roomId, (event) => {
      setWinnerId(event.winner_id)
      setSpinDuration(event.duration_ms)
      setSpinning(true)
    })

    return () => {
      unsubRoom()
      unsubSpin()
    }
  }, [roomId, movies, winner])

  useEffect(() => {
    if (!spinning || !winnerId || movies.length === 0) return

    const winnerMovie = movies.find((m) => m.id === winnerId)
    if (winnerMovie) {
      const timer = setTimeout(() => {
        setWinner(winnerMovie)
        setSpinning(false)
      }, spinDuration + 500)
      return () => clearTimeout(timer)
    }
  }, [spinning, winnerId, movies, spinDuration])

  useEffect(() => {
    if (!winner) return

    const fetchProviders = async () => {
      setProvidersLoading(true)
      try {
        const res = await fetch(`/api/tmdb/watch?movieId=${winner.id}`)
        if (res.ok) {
          const data = await res.json()
          setProviders(data.providers ?? [])
        }
      } catch {
        // non-critical
      } finally {
        setProvidersLoading(false)
      }
    }

    fetchProviders()
  }, [winner])

  const handleSpin = async () => {
    if (!roomId || movies.length === 0) return

    const winnerIndex = Math.floor(Math.random() * movies.length)
    const winnerMovie = movies[winnerIndex]

    try {
      await broadcastSpinStart(roomId, winnerMovie.id, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start spin')
    }
  }

  const handleSpinEnd = async () => {
    if (!roomId) return
    try {
      await updateRoomStatus(roomId, 'result')
    } catch {
      // non-critical
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
      <div className="container mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/room')}>Back to Rooms</Button>
      </div>
    )
  }

  const isHost = userId ? userId === room?.host_id : false
  const showSpinButton = isHost && !spinning && !winner && movies.length > 0

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card className="bg-surface border border-accent-gold/10 rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className={`text-2xl flex items-center justify-center gap-2 ${winner ? '' : ''}`}>
            {winner ? (
              <>
                <Trophy className="w-6 h-6 text-accent-gold" />
                <span className="font-display text-accent-gold">Tonight&apos;s Pick</span>
              </>
            ) : (
              <>
                <RotateCw className="w-6 h-6 text-accent-gold" />
                <span className="font-display text-accent-gold">The Wheel</span>
              </>
            )}
          </CardTitle>
          {!winner && (
            <p className="text-sm text-muted-foreground">
              {movies.length > 0
                ? `${movies.length} movie${movies.length > 1 ? 's' : ''} in the pool`
                : 'No matches yet'}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {winner ? (
            <div className="text-center space-y-4">
              <div className="relative aspect-[2/3] max-w-[250px] mx-auto rounded-xl overflow-hidden shadow-2xl shadow-[0_0_30px_rgba(212,175,55,0.2)] border-2 border-accent-gold/50">
                {winner.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${winner.poster_path}`}
                    alt={winner.title}
                    fill
                    className="object-cover"
                    sizes="250px"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">No poster</p>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{winner.title}</h2>
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent-gold text-accent-gold" />
                    {winner.vote_average.toFixed(1)}
                  </span>
                  <span>{winner.release_date?.slice(0, 4)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto line-clamp-3">
                  {winner.overview}
                </p>
              </div>
              {providers.length > 0 ? (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
                    <Monitor className="w-4 h-4" />
                    Available on
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {providers.map((p) => (
                      <div key={p.provider_name} className="flex flex-col items-center gap-1.5">
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                          alt={p.provider_name}
                          width={48}
                          height={48}
                          className="rounded-xl bg-white/10"
                        />
                        <span className="text-[11px] text-muted-foreground max-w-[64px] text-center leading-tight">
                          {p.provider_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : providersLoading ? null : (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Not currently streaming
                </p>
              )}
              <Button
                onClick={() => router.push('/room')}
                variant="gold-outline"
                className="mt-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rooms
              </Button>
            </div>
          ) : movies.length > 0 ? (
            <div className="flex flex-col items-center gap-6">
              <Wheel
                movies={movies}
                winnerId={winnerId}
                spinning={spinning}
                durationMs={spinDuration}
                onSpinEnd={handleSpinEnd}
              />
              {spinning ? (
                <div className="text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent-gold" />
                  <p className="text-sm text-muted-foreground">Spinning...</p>
                </div>
              ) : showSpinButton ? (
                <Button
                  onClick={handleSpin}
                  variant="gold"
                  size="lg"
                  className="text-lg px-8 h-12 w-full max-w-xs"
                >
                  <RotateCw className="w-5 h-5 mr-2" />
                  Spin the Wheel
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-gold/50 animate-pulse inline-block" />
                  Waiting for the host to spin...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">
                No movies matched. Try again with a different group.
              </p>
              <Button onClick={() => router.push('/room')} variant="gold-outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rooms
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
