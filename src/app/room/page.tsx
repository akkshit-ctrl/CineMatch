'use client'

import { useState, useEffect } from 'react'
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
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  useEffect(() => {
    fetch('/api/tmdb/genres')
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch(() => {})
  }, [])

  const ensureName = (): boolean => {
    const name = sessionStorage.getItem('cinematch_user_name')
    if (!name) {
      setShowNamePrompt(true)
      return false
    }
    return true
  }

  const handleCreate = async () => {
    if (!ensureName()) return

    setCreating(true)
    setError('')

    try {
      const userId = generateUserId()
      const room = await createRoom(
        userId,
        genreId ? parseInt(genreId, 10) : undefined
      )
      router.push(`/room/${room.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    if (!ensureName()) return

    setJoining(true)
    setError('')

    try {
      const room = await getRoom(joinCode.trim().toUpperCase())
      if (!room) {
        setError('Room not found. Check the code and try again.')
        return
      }
      generateUserId()
      router.push(`/room/${room.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setJoining(false)
    }
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
          </div>

          <Button
            variant="gold"
            onClick={handleCreate}
            disabled={creating}
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
              disabled={joining || !joinCode.trim()}
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
        onClose={() => setShowNamePrompt(false)}
        onSubmit={(name) => {
          sessionStorage.setItem('cinematch_user_name', name)
          setShowNamePrompt(false)
        }}
      />
    </div>
  )
}
