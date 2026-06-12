'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getRoom,
  updateRoomStatus,
  updateRoomConfig,
  subscribeRoom,
  subscribePresence,
  updatePresence,
  reassignHost,
} from '@/lib/room'
import { Loader2, Copy, Users, Play, Crown, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Room, Participant, AIRecommendation } from '@/types'

export default function LobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showWarning, setShowWarning] = useState(false)
  const [showHostLeftBanner, setShowHostLeftBanner] = useState(false)
  const [vibeDescription, setVibeDescription] = useState('')
  const [analyzingVibe, setAnalyzingVibe] = useState(false)
  const [vibeResult, setVibeResult] = useState<AIRecommendation | null>(null)
  const [vibeError, setVibeError] = useState('')
  const presenceCleanupRef = useRef<(() => void) | null>(null)
  const hasSeenHostRef = useRef(false)

  useEffect(() => {
    params.then(({ id }) => setRoomId(id))
  }, [params])

  const userId = typeof window !== 'undefined'
    ? sessionStorage.getItem('cinematch_user_id')
    : null

  const userName = typeof window !== 'undefined'
    ? sessionStorage.getItem('cinematch_user_name') ?? 'Anonymous'
    : 'Anonymous'

  useEffect(() => {
    if (showHostLeftBanner) {
      const t = setTimeout(() => setShowHostLeftBanner(false), 5000)
      return () => clearTimeout(t)
    }
  }, [showHostLeftBanner])

  useEffect(() => {
    if (!roomId) return

    const loadRoom = async () => {
      try {
        const data = await getRoom(roomId)
        if (!data) {
          setError('Room not found')
          return
        }
        setRoom(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room')
      } finally {
        setLoading(false)
      }
    }

    loadRoom()

    const unsubRoom = subscribeRoom(roomId, (updated) => {
      setRoom(updated)
      if (updated.status === 'swiping') {
        router.push(`/room/${roomId}/swipe`)
      }
    })

    return unsubRoom
  }, [roomId, router])

  useEffect(() => {
    if (!roomId || !room || !userId) return

    const isHost = userId === room.host_id

    const unsubPresence = subscribePresence(roomId, setParticipants)

    updatePresence(roomId, userId, userName, isHost).then((unsub) => {
      presenceCleanupRef.current?.()
      presenceCleanupRef.current = unsub
    })

    return () => {
      unsubPresence()
      presenceCleanupRef.current?.()
    }
  }, [roomId, room, userId, userName])

  useEffect(() => {
    if (!room || participants.length === 0 || !userId) return

    const hostInRoom = participants.some((p) => p.user_id === room.host_id)

    if (hostInRoom) {
      hasSeenHostRef.current = true
    }

    if (!hostInRoom && hasSeenHostRef.current && userId !== room.host_id && roomId) {
      reassignHost(roomId, userId)
      setShowHostLeftBanner(true)
      hasSeenHostRef.current = false
    }
  }, [participants, room, userId, roomId])

  const handleAnalyzeVibe = async () => {
    if (!roomId || !vibeDescription.trim()) return
    setAnalyzingVibe(true)
    setVibeError('')
    setVibeResult(null)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibe: vibeDescription.trim() }),
      })
      if (!res.ok) throw new Error('AI recommendation failed')
      const data: AIRecommendation = await res.json()
      await updateRoomConfig(roomId, {
        genre_id: data.genre_ids[0],
        tmdb_config: {
          keywords: data.keywords,
          year_range: data.year_range,
        },
      })
      setVibeResult(data)
      toast.success('Vibe analyzed! Movies will be filtered accordingly.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze vibe'
      setVibeError(msg)
      toast.error(msg)
    } finally {
      setAnalyzingVibe(false)
    }
  }

  const handleCopyCode = () => {
    if (!roomId) return
    navigator.clipboard.writeText(roomId)
    toast.success('Room code copied!', { duration: 2000 })
  }

  const handleStart = async () => {
    if (!roomId) return
    if (participants.length <= 1) {
      setShowWarning(true)
    }
    setStarting(true)
    try {
      await updateRoomStatus(roomId, 'swiping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start')
    } finally {
      setStarting(false)
    }
  }

  if (!roomId || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading room...</p>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || 'This room does not exist.'}</p>
        <Button onClick={() => router.push('/room')}>Back to Rooms</Button>
      </div>
    )
  }

  const isHost = userId === room.host_id

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      {showHostLeftBanner && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-200 text-center mb-4">
          The host has left. You are now the host.
        </div>
      )}

      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Waiting Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Share this code with friends</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl tracking-[0.3em] font-mono font-bold text-primary">
                {room.id}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isHost && (
            <div className="border-t border-border pt-6 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Set a vibe (optional)</span>
              </div>
              <textarea
                placeholder="e.g., '90s sci-fi thriller with a twist'..."
                value={vibeDescription}
                onChange={(e) => setVibeDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-input bg-card/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeVibe}
                  disabled={analyzingVibe || !vibeDescription.trim()}
                >
                  {analyzingVibe ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5" />
                  )}
                  Analyze Vibe
                </Button>
                {vibeResult && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {vibeResult.genre_ids.length} genre{vibeResult.genre_ids.length > 1 ? 's' : ''} set
                  </span>
                )}
              </div>
              {vibeError && (
                <p className="text-xs text-red-400">{vibeError}</p>
              )}
            </div>
          )}

          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {participants.length > 0
                  ? `${participants.length} player${participants.length !== 1 ? 's' : ''} in room`
                  : 'Waiting for players...'}
              </span>
            </div>

            <div className="space-y-2">
              {participants.map((p) => {
                const isMe = p.user_id === userId
                const isParticipantHost = p.user_id === room.host_id
                return (
                  <div
                    key={p.user_id}
                    className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {isMe ? 'You' : p.name}
                      </span>
                    </div>
                    {isParticipantHost && (
                      <span className="text-xs flex items-center gap-1 text-yellow-400 shrink-0">
                        <Crown className="w-3 h-3" />
                        Host
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {isHost && (
            <div className="space-y-2">
              <Button
                onClick={handleStart}
                disabled={starting}
                className="w-full h-12 text-lg"
              >
                {starting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                Start Swiping
              </Button>
              {showWarning && participants.length <= 1 && (
                <p className="text-sm text-muted-foreground text-center">
                  You&apos;re alone in this room. You can still test the swiping feature.
                </p>
              )}
            </div>
          )}

          {!isHost && (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for the host to start...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
