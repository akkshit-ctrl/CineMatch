'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import GenrePill from '@/components/genre-pill'
import NamePromptModal from '@/components/name-prompt-modal'
import { createRoom, getRoom } from '@/lib/room'
import { Users, ArrowRight, Loader2 } from 'lucide-react'

interface Genre {
  id: number
  name: string
}

type PendingRoomAction =
  | { kind: 'create'; genreId?: number }
  | { kind: 'join'; code: string }

function isGenre(value: unknown): value is Genre {
  if (typeof value !== 'object' || value === null) return false

  const genre = value as { id?: unknown; name?: unknown }
  return typeof genre.id === 'number' && Number.isInteger(genre.id) && genre.id > 0 &&
    typeof genre.name === 'string' && genre.name.trim().length > 0
}

function generateUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('cinematch_user_id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('cinematch_user_id', id)
  }
  return id
}

export default function RoomPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [genreId, setGenreId] = useState('')
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreError, setGenreError] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingRoomAction | null>(null)
  const actionInFlight = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    const loadGenres = async () => {
      try {
        const response = await fetch('/api/tmdb/genres', { signal: controller.signal })
        if (!response.ok) throw new Error('Genre request failed')

        const data: unknown = await response.json()
        if (!Array.isArray(data) || !data.every(isGenre)) {
          throw new Error('Invalid genre response')
        }

        if (!controller.signal.aborted) setGenres(data)
      } catch {
        if (!controller.signal.aborted) {
          setGenreError('Genre filters could not be loaded. You can continue with Any Genre.')
        }
      }
    }

    void loadGenres()
    return () => controller.abort()
  }, [])

  const performAction = async (action: PendingRoomAction) => {
    if (actionInFlight.current) return
    actionInFlight.current = true
    setError('')
    setCreating(action.kind === 'create')
    setJoining(action.kind === 'join')

    try {
      if (action.kind === 'create') {
        const room = await createRoom(generateUserId(), action.genreId)
        router.push(`/room/${room.id}`)
      } else {
        const room = await getRoom(action.code)
        if (!room) {
          setError('Room not found. Check the code and try again.')
          return
        }
        generateUserId()
        router.push(`/room/${room.id}`)
      }
    } catch (err) {
      const fallback = action.kind === 'create' ? 'Failed to create room' : 'Failed to join room'
      setError(err instanceof Error ? err.message : fallback)
    } finally {
      actionInFlight.current = false
      setCreating(false)
      setJoining(false)
    }
  }

  const requestAction = (action: PendingRoomAction) => {
    if (actionInFlight.current) return
    if (!sessionStorage.getItem('cinematch_user_name')) {
      setPendingAction(action)
      setShowNamePrompt(true)
      return
    }

    void performAction(action)
  }

  const handleCreate = () => requestAction({
    kind: 'create',
    genreId: genreId ? Number(genreId) : undefined,
  })

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (code) requestAction({ kind: 'join', code })
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8 pb-24">
      <div className="text-center mb-8 space-y-2">
        <h1 className="font-display text-accent-gold text-2xl">
          Room Hub
        </h1>
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Users className="w-4 h-4" />
          Watch with friends
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-accent-gold/10 rounded-xl p-6 space-y-4">
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground block text-center">
              Genre filter (optional)
            </label>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setGenreId('')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                  genreId === ''
                    ? 'bg-accent-gold/15 text-accent-gold border-accent-gold'
                    : 'bg-transparent text-muted-foreground border-accent-gold/10 hover:border-accent-gold/30 hover:text-foreground'
                }`}
              >
                Any Genre
              </button>
              {genres.map((genre) => (
                <GenrePill
                  key={genre.id}
                  name={genre.name}
                  selected={genreId === String(genre.id)}
                  onClick={() => setGenreId(String(genre.id))}
                />
              ))}
            </div>
            {genreError && (
              <p role="status" className="text-sm text-muted-foreground">
                {genreError}
              </p>
            )}
          </div>

          <Button
            variant="gold"
            onClick={handleCreate}
            disabled={creating || joining}
            className="w-full"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            Create Room
          </Button>
        </div>

        <div className="bg-surface border border-accent-gold/10 rounded-xl p-6 space-y-4">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block text-center">
                Room code
              </label>
              <input
                placeholder="ABCD"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="w-full bg-elevated border border-accent-gold/10 focus:ring-1 focus:ring-accent-gold/40 rounded-lg text-center text-2xl tracking-[0.3em] font-mono uppercase h-14 text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-shadow"
              />
            </div>
            <Button
              type="submit"
              variant="gold-outline"
              disabled={creating || joining || !joinCode.trim()}
              className="w-full"
            >
              {joining ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Join Room
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-center mt-6 text-sm">{error}</p>
      )}

      <NamePromptModal
        open={showNamePrompt}
        onClose={() => {
          setPendingAction(null)
          setShowNamePrompt(false)
        }}
        onSubmit={(name) => {
          sessionStorage.setItem('cinematch_user_name', name)
          const action = pendingAction
          setPendingAction(null)
          setShowNamePrompt(false)
          if (action) void performAction(action)
        }}
      />
    </div>
  )
}
