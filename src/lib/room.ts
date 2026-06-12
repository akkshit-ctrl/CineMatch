import { getSupabase } from './supabase'
import type { Room, Participant } from '@/types'
import type { Database } from './database.types'

type DbRoom = Database['public']['Tables']['rooms']['Row']

function toRoom(db: DbRoom): Room {
  return {
    id: db.id,
    host_id: db.host_id,
    status: (db.status ?? 'lobby') as Room['status'],
    genre_id: db.genre_id ?? undefined,
    match_pool: (db.match_pool ?? []) as number[],
    created_at: db.created_at ?? '',
    tmdb_config: db.tmdb_config as Room['tmdb_config'] ?? undefined,
  }
}

export async function updateRoomConfig(
  roomId: string,
  config: { genre_id?: number; tmdb_config?: Room['tmdb_config'] }
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('rooms')
    .update(config as never)
    .eq('id', roomId)

  if (error) throw new Error(`Failed to update room config: ${error.message}`)
}

export async function createRoom(hostId: string, genreId?: number): Promise<Room> {
  const supabase = getSupabase()

  const id = generateRoomCode()

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      id,
      host_id: hostId,
      status: 'lobby',
      genre_id: genreId ?? null,
      match_pool: [],
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create room: ${error.message}`)
  return toRoom(data)
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('rooms')
    .select()
    .eq('id', roomId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get room: ${error.message}`)
  }

  return toRoom(data)
}

export async function updateRoomStatus(
  roomId: string,
  status: Room['status']
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('rooms')
    .update({ status })
    .eq('id', roomId)

  if (error) throw new Error(`Failed to update room status: ${error.message}`)
}

export async function castVote(
  roomId: string,
  userId: string,
  movieId: number,
  vote: boolean
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.from('votes').insert({
    room_id: roomId,
    user_id: userId,
    movie_id: movieId,
    vote,
  })

  if (error) throw new Error(`Failed to cast vote: ${error.message}`)
}

export async function castVoteRpc(
  roomId: string,
  userId: string,
  movieId: number,
  vote: boolean
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.rpc('cast_vote', {
    p_room_id: roomId,
    p_user_id: userId,
    p_movie_id: movieId,
    p_vote: vote,
  })

  if (error) throw new Error(`Failed to cast vote: ${error.message}`)
}

export async function getVoteCounts(
  roomId: string,
  movieId: number
): Promise<{ yes: number; no: number; total: number }> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('votes')
    .select('vote')
    .eq('room_id', roomId)
    .eq('movie_id', movieId)

  if (error) throw new Error(`Failed to get vote counts: ${error.message}`)

  const yes = data.filter((v) => v.vote).length
  const no = data.filter((v) => !v.vote).length

  return { yes, no, total: data.length }
}

export async function calculateMatchPool(roomId: string, threshold: number = 0.51): Promise<number[]> {
  const supabase = getSupabase()

  const { data: votes, error } = await supabase
    .from('votes')
    .select('movie_id, vote')
    .eq('room_id', roomId)

  if (error) throw new Error(`Failed to calculate match pool: ${error.message}`)

  const movieVotes = new Map<number, { yes: number; no: number }>()

  for (const v of votes) {
    const current = movieVotes.get(v.movie_id) ?? { yes: 0, no: 0 }
    if (v.vote) current.yes++
    else current.no++
    movieVotes.set(v.movie_id, current)
  }

  const matched: number[] = []

  for (const [movieId, counts] of movieVotes) {
    const total = counts.yes + counts.no
    if (total > 0 && counts.yes / total >= threshold) {
      matched.push(movieId)
    }
  }

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ match_pool: matched })
    .eq('id', roomId)

  if (updateError) {
    throw new Error(`Failed to save match pool: ${updateError.message}`)
  }

  return matched
}

export interface SpinEvent {
  winner_id: number
  duration_ms: number
  start_time: string
}

export function subscribeRoom(
  roomId: string,
  onUpdate: (room: Room) => void
) {
  const supabase = getSupabase()

  const subscription = supabase
    .channel(`room-state:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        onUpdate(toRoom(payload.new as DbRoom))
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

export function subscribeSpinEvent(
  roomId: string,
  onSpin: (event: SpinEvent) => void
) {
  const supabase = getSupabase()

  const subscription = supabase
    .channel(`room-spin:${roomId}`)
    .on(
      'broadcast',
      { event: 'SPIN_START' },
      (payload) => {
        onSpin(payload.payload as SpinEvent)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

export async function broadcastSpinStart(
  roomId: string,
  winnerId: number,
  durationMs: number = 5000
): Promise<void> {
  const supabase = getSupabase()

  const spinEvent: SpinEvent = {
    winner_id: winnerId,
    duration_ms: durationMs,
    start_time: new Date().toISOString(),
  }

  const spinChannel = supabase.channel(`room-spin:${roomId}`)

  await new Promise<void>((resolve, reject) => {
    spinChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        resolve()
      } else if (status === 'CHANNEL_ERROR') {
        reject(new Error('Failed to subscribe to spin channel'))
      }
    })
  })

  const response = await spinChannel.send({
    type: 'broadcast',
    event: 'SPIN_START',
    payload: spinEvent,
  })

  spinChannel.unsubscribe()

  if (response !== 'ok') throw new Error(`Failed to broadcast spin: ${response}`)
}

export function subscribePresence(
  roomId: string,
  onPresence: (participants: Participant[]) => void
): () => void {
  const supabase = getSupabase()

  const channel = supabase.channel(`presence:${roomId}`)

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const participants: Participant[] = Object.values(state)
        .flat()
        .map((p: Record<string, unknown>) => ({
          user_id: String(p.user_id ?? ''),
          name: String(p.name ?? ''),
          is_host: Boolean(p.is_host),
          online_at: String(p.online_at ?? ''),
        }))
      onPresence(participants)
    })
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

export async function updatePresence(
  roomId: string,
  userId: string,
  name: string,
  isHost: boolean
): Promise<() => void> {
  const supabase = getSupabase()

  const channel = supabase.channel(`presence:${roomId}`)

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user_id: userId,
          name,
          is_host: isHost,
          online_at: new Date().toISOString(),
        })
        resolve()
      } else if (status === 'CHANNEL_ERROR') {
        reject(new Error('Failed to subscribe to presence channel'))
      }
    })
  })

  return () => {
    channel.unsubscribe()
  }
}

export async function reassignHost(roomId: string, newHostId: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('rooms')
    .update({ host_id: newHostId })
    .eq('id', roomId)

  if (error) throw new Error(`Failed to reassign host: ${error.message}`)
}

export async function broadcastVote(
  roomId: string,
  movieId: number,
  userId: string,
  vote: boolean,
  sharedChannel?: ReturnType<ReturnType<typeof getSupabase>['channel']>
): Promise<void> {
  const supabase = getSupabase()
  const channel = sharedChannel ?? supabase.channel(`room-votes:${roomId}`)

  if (!sharedChannel) {
    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
        else if (status === 'CHANNEL_ERROR') reject(new Error('Failed to subscribe to vote channel'))
      })
    })
  }

  const response = await channel.send({
    type: 'broadcast',
    event: 'VOTE_CAST',
    payload: { movie_id: movieId, user_id: userId, vote },
  })

  if (!sharedChannel) channel.unsubscribe()

  if (response !== 'ok') throw new Error(`Failed to broadcast vote: ${response}`)
}

export function subscribeVoteCast(
  roomId: string,
  onVote: (payload: { movie_id: number; user_id: string; vote: boolean }) => void
): () => void {
  const supabase = getSupabase()

  const subscription = supabase
    .channel(`room-votes:${roomId}`)
    .on(
      'broadcast',
      { event: 'VOTE_CAST' },
      (payload) => {
        onVote(payload.payload as { movie_id: number; user_id: string; vote: boolean })
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

export function generateRoomCode(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < Math.min(length, 6); i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
