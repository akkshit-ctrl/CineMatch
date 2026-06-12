'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createRoom, getRoom } from '@/lib/room'
import { Users, ArrowRight, Loader2 } from 'lucide-react'

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
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [promptName, setPromptName] = useState('')
  const [nameError, setNameError] = useState('')

  const ensureName = (): boolean => {
    const name = sessionStorage.getItem('cinematch_user_name')
    if (!name) {
      setShowNamePrompt(true)
      setPromptName('')
      setNameError('')
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

  const handleNameSubmit = () => {
    const trimmed = promptName.trim()
    if (!trimmed) {
      setNameError('Please enter a display name')
      return
    }
    sessionStorage.setItem('cinematch_user_name', trimmed)
    setShowNamePrompt(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          CineMatch
        </h1>
        <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          Watch with friends
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle>Create a Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Genre filter (optional)
              </label>
              <Input
                type="number"
                placeholder="TMDB Genre ID (e.g., 28 for Action)"
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
              />
            </div>
            <Button
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
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle>Join a Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Room code
                </label>
                <Input
                  placeholder="e.g., ABCD"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                />
              </div>
              <Button
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="w-full"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Join
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="text-red-400 text-center mt-6 text-sm">{error}</p>
      )}

      {showNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-lg font-semibold mb-1">Choose your display name</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This is how other players will see you.
            </p>
            <Input
              placeholder="Enter your name"
              value={promptName}
              onChange={(e) => { setPromptName(e.target.value); setNameError('') }}
              onKeyDown={handleNameKeyDown}
              maxLength={24}
              className="mb-2"
              autoFocus
            />
            {nameError && (
              <p className="text-red-400 text-xs mb-2">{nameError}</p>
            )}
            <Button onClick={handleNameSubmit} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
