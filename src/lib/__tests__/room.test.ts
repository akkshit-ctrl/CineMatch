import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createRoom,
  getRoom,
  updateRoomStatus,
  castVote,
  castVoteRpc,
  calculateMatchPool,
  subscribeRoom,
  subscribeSpinEvent,
  generateRoomCode,
  getVoteCounts,
  subscribePresence,
  updatePresence,
  reassignHost,
  broadcastVote,
  subscribeVoteCast,
  broadcastSpinStart,
} from '../room'

const mockFrom = vi.fn()
const mockChannel = vi.fn()
const mockRpc = vi.fn()
const mockSupabase = {
  from: mockFrom,
  channel: mockChannel,
  rpc: mockRpc,
}

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => mockSupabase,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createRoom', () => {
  it('generates a room code, inserts to Supabase, returns a Room object', async () => {
    const insertResult = { id: 'ABCD', host_id: 'host-1', status: 'lobby', genre_id: 28, match_pool: [], created_at: '2024-01-01T00:00:00Z' }
    const singleFn = vi.fn().mockResolvedValue({ data: insertResult, error: null })
    const selectFn = vi.fn().mockReturnValue({ single: singleFn })
    const insertFn = vi.fn().mockReturnValue({ select: selectFn })
    mockFrom.mockReturnValue({ insert: insertFn })

    const room = await createRoom('host-1', 28)

    expect(mockFrom).toHaveBeenCalledWith('rooms')
    expect(insertFn).toHaveBeenCalledWith({
      id: expect.any(String),
      host_id: 'host-1',
      status: 'lobby',
      genre_id: 28,
      match_pool: [],
    })
    expect(room).toEqual({
      id: 'ABCD',
      host_id: 'host-1',
      status: 'lobby',
      genre_id: 28,
      match_pool: [],
      created_at: '2024-01-01T00:00:00Z',
    })
  })
})

describe('getRoom', () => {
  it('fetches room by ID, returns null if not found', async () => {
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
    const eqFn = vi.fn().mockReturnValue({ single: singleFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ select: selectFn })

    const room = await getRoom('NONEXIST')
    expect(room).toBeNull()
  })

  it('throws on unexpected error', async () => {
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: { code: 'UNKNOWN', message: 'DB failure' } })
    const eqFn = vi.fn().mockReturnValue({ single: singleFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ select: selectFn })

    await expect(getRoom('ABCD')).rejects.toThrow('Failed to get room')
  })
})

describe('updateRoomStatus', () => {
  it('updates the status column', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ update: updateFn })

    await updateRoomStatus('ABCD', 'spinning')

    expect(mockFrom).toHaveBeenCalledWith('rooms')
    expect(updateFn).toHaveBeenCalledWith({ status: 'spinning' })
    expect(eqFn).toHaveBeenCalledWith('id', 'ABCD')
  })
})

describe('generateRoomCode', () => {
  it('returns a 4-character alphanumeric code', () => {
    const code = generateRoomCode()
    expect(code).toHaveLength(4)
    expect(code).toMatch(/^[A-Z2-9]{4}$/)
  })

  it('produces different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(1)
  })

  it('accepts custom length and caps at 6', () => {
    const code5 = generateRoomCode(5)
    expect(code5).toHaveLength(5)
    expect(code5).toMatch(/^[A-Z2-9]{5}$/)

    const code6 = generateRoomCode(6)
    expect(code6).toHaveLength(6)

    const codeOver = generateRoomCode(10)
    expect(codeOver).toHaveLength(6)
  })
})

describe('castVote', () => {
  it('inserts a vote record', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertFn })

    await castVote('ABCD', 'user-1', 123, true)

    expect(mockFrom).toHaveBeenCalledWith('votes')
    expect(insertFn).toHaveBeenCalledWith({
      room_id: 'ABCD',
      user_id: 'user-1',
      movie_id: 123,
      vote: true,
    })
  })
})

describe('castVoteRpc', () => {
  it('calls the cast_vote RPC function and throws on error', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await castVoteRpc('ABCD', 'user-1', 123, true)
    expect(mockRpc).toHaveBeenCalledWith('cast_vote', {
      p_room_id: 'ABCD',
      p_user_id: 'user-1',
      p_movie_id: 123,
      p_vote: true,
    })
  })

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'RPC failed' } })
    await expect(castVoteRpc('ABCD', 'user-1', 123, true)).rejects.toThrow('Failed to cast vote')
  })
})

describe('calculateMatchPool', () => {
  it('computes 51% threshold correctly and updates room match_pool', async () => {
    const mockVotes = [
      { movie_id: 1, vote: true },
      { movie_id: 1, vote: true },
      { movie_id: 1, vote: false },
      { movie_id: 2, vote: true },
      { movie_id: 2, vote: false },
    ]
    const eqUpdateFn = vi.fn().mockResolvedValue({ error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: eqUpdateFn })
    const eqVotesFn = vi.fn().mockResolvedValue({ data: mockVotes, error: null })

    mockFrom
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: eqVotesFn }) })
      .mockReturnValueOnce({ update: updateFn })

    const result = await calculateMatchPool('ABCD')

    expect(result).toEqual([1])
    expect(updateFn).toHaveBeenCalledWith({ match_pool: [1] })
    expect(eqUpdateFn).toHaveBeenCalledWith('id', 'ABCD')
  })
})

describe('subscribeRoom', () => {
  it('sets up a postgres_changes subscription', () => {
    const subscribeFn = vi.fn()
    const onFn = vi.fn().mockReturnValue({ subscribe: subscribeFn })
    const channelObj = { on: onFn }
    mockChannel.mockReturnValue(channelObj)

    const onUpdate = vi.fn()
    const unsub = subscribeRoom('ABCD', onUpdate)

    expect(mockChannel).toHaveBeenCalledWith('room-state:ABCD')
    expect(onFn).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: 'id=eq.ABCD',
      },
      expect.any(Function)
    )
    expect(typeof unsub).toBe('function')
  })
})

describe('subscribeSpinEvent', () => {
  it('sets up a broadcast subscription', () => {
    const subscribeFn = vi.fn()
    const onFn = vi.fn().mockReturnValue({ subscribe: subscribeFn })
    const channelObj = { on: onFn }
    mockChannel.mockReturnValue(channelObj)

    const onSpin = vi.fn()
    const unsub = subscribeSpinEvent('ABCD', onSpin)

    expect(mockChannel).toHaveBeenCalledWith('room-spin:ABCD')
    expect(onFn).toHaveBeenCalledWith(
      'broadcast',
      { event: 'SPIN_START' },
      expect.any(Function)
    )
    expect(typeof unsub).toBe('function')
  })
})

describe('getVoteCounts', () => {
  it('returns yes/no/total counts from filtered votes', async () => {
    const mockVoteData = [
      { vote: true },
      { vote: true },
      { vote: false },
      { vote: true },
    ]
    const eqMovieFn = vi.fn().mockResolvedValue({ data: mockVoteData, error: null })
    const eqRoomFn = vi.fn().mockReturnValue({ eq: eqMovieFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqRoomFn })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await getVoteCounts('ABCD', 123)

    expect(mockFrom).toHaveBeenCalledWith('votes')
    expect(selectFn).toHaveBeenCalledWith('vote')
    expect(eqRoomFn).toHaveBeenCalledWith('room_id', 'ABCD')
    expect(eqMovieFn).toHaveBeenCalledWith('movie_id', 123)
    expect(result).toEqual({ yes: 3, no: 1, total: 4 })
  })

  it('returns zeros when no votes exist', async () => {
    const eqMovieFn = vi.fn().mockResolvedValue({ data: [], error: null })
    const eqRoomFn = vi.fn().mockReturnValue({ eq: eqMovieFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqRoomFn })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await getVoteCounts('ABCD', 999)

    expect(result).toEqual({ yes: 0, no: 0, total: 0 })
  })

  it('throws on database error', async () => {
    const eqMovieFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'Vote fetch failed' } })
    const eqRoomFn = vi.fn().mockReturnValue({ eq: eqMovieFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqRoomFn })
    mockFrom.mockReturnValue({ select: selectFn })

    await expect(getVoteCounts('ABCD', 123)).rejects.toThrow('Failed to get vote counts')
  })
})

describe('subscribePresence', () => {
  it('sets up a presence channel and returns unsubscribe function', () => {
    const presenceStateFn = vi.fn().mockReturnValue({
      'user-1': [{ user_id: 'user-1', name: 'Alice', is_host: true, online_at: '2024-01-01T00:00:00Z' }],
      'user-2': [{ user_id: 'user-2', name: 'Bob', is_host: false, online_at: '2024-01-01T00:00:01Z' }],
    })
    const unsubscribeFn = vi.fn()
    const subscribeFn = vi.fn()
    const onFn = vi.fn().mockReturnValue({ subscribe: subscribeFn, presenceState: presenceStateFn, unsubscribe: unsubscribeFn })
    const channelObj = { on: onFn, subscribe: subscribeFn, presenceState: presenceStateFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const onPresence = vi.fn()
    const unsub = subscribePresence('ABCD', onPresence)

    expect(mockChannel).toHaveBeenCalledWith('presence:ABCD')
    expect(onFn).toHaveBeenCalledWith('presence', { event: 'sync' }, expect.any(Function))
    expect(subscribeFn).toHaveBeenCalledOnce()
    expect(typeof unsub).toBe('function')
  })

  it('calls onPresence with participants when presence sync fires', () => {
    const presenceStateFn = vi.fn().mockReturnValue({
      'user-1': [{ user_id: 'user-1', name: 'Alice', is_host: true, online_at: '2024-01-01T00:00:00Z' }],
    })
    const unsubscribeFn = vi.fn()
    const subscribeFn = vi.fn()
    let capturedCallback: () => void = () => {}
    const onFn = vi.fn().mockImplementation((_type: string, _config: unknown, cb: () => void) => {
      capturedCallback = cb
      return { subscribe: subscribeFn, presenceState: presenceStateFn, unsubscribe: unsubscribeFn }
    })
    const channelObj = { on: onFn, subscribe: subscribeFn, presenceState: presenceStateFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const onPresence = vi.fn()
    subscribePresence('ABCD', onPresence)

    // Trigger the presence sync callback
    capturedCallback()

    expect(onPresence).toHaveBeenCalledWith([
      { user_id: 'user-1', name: 'Alice', is_host: true, online_at: '2024-01-01T00:00:00Z' },
    ])
  })
})

describe('updatePresence', () => {
  it('subscribes to presence channel, tracks user data, returns unsubscribe', async () => {
    const trackFn = vi.fn()
    const unsubscribeFn = vi.fn()
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, track: trackFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = updatePresence('ABCD', 'user-1', 'Alice', true)

    // Trigger the subscribe callback with SUBSCRIBED status
    subscribeCallback('SUBSCRIBED')

    const unsub = await resultPromise

    expect(mockChannel).toHaveBeenCalledWith('presence:ABCD')
    expect(subscribeFn).toHaveBeenCalledOnce()
    expect(trackFn).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'Alice',
      is_host: true,
      online_at: expect.any(String),
    })
    expect(typeof unsub).toBe('function')
  })

  it('rejects when channel errors', async () => {
    const trackFn = vi.fn()
    const unsubscribeFn = vi.fn()
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, track: trackFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = updatePresence('ABCD', 'user-1', 'Alice', false)

    subscribeCallback('CHANNEL_ERROR')

    await expect(resultPromise).rejects.toThrow('Failed to subscribe to presence channel')
    expect(trackFn).not.toHaveBeenCalled()
  })
})

describe('reassignHost', () => {
  it('updates host_id on the room', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ update: updateFn })

    await reassignHost('ABCD', 'new-host-uuid')

    expect(mockFrom).toHaveBeenCalledWith('rooms')
    expect(updateFn).toHaveBeenCalledWith({ host_id: 'new-host-uuid' })
    expect(eqFn).toHaveBeenCalledWith('id', 'ABCD')
  })

  it('throws on error', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } })
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ update: updateFn })

    await expect(reassignHost('ABCD', 'new-host-uuid')).rejects.toThrow('Failed to reassign host')
  })
})

describe('broadcastVote', () => {
  it('subscribes to channel, sends VOTE_CAST broadcast, returns unsubscribe', async () => {
    const unsubscribeFn = vi.fn()
    const sendFn = vi.fn().mockResolvedValue('ok')
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = broadcastVote('ABCD', 123, 'user-1', true)

    // Trigger the subscribe callback
    subscribeCallback('SUBSCRIBED')

    await resultPromise

    expect(mockChannel).toHaveBeenCalledWith('room-votes:ABCD')
    expect(subscribeFn).toHaveBeenCalledOnce()
    expect(sendFn).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'VOTE_CAST',
      payload: { movie_id: 123, user_id: 'user-1', vote: true },
    })
    expect(unsubscribeFn).toHaveBeenCalledOnce()
  })

  it('throws when subscribe errors', async () => {
    const unsubscribeFn = vi.fn()
    const sendFn = vi.fn().mockResolvedValue('ok')
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = broadcastVote('ABCD', 123, 'user-1', true)

    subscribeCallback('CHANNEL_ERROR')

    await expect(resultPromise).rejects.toThrow('Failed to subscribe to vote channel')
    expect(sendFn).not.toHaveBeenCalled()
  })

  it('throws when send fails', async () => {
    const unsubscribeFn = vi.fn()
    const sendFn = vi.fn().mockResolvedValue('error')
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = broadcastVote('ABCD', 123, 'user-1', true)

    subscribeCallback('SUBSCRIBED')

    await expect(resultPromise).rejects.toThrow('Failed to broadcast vote')
  })
})

describe('subscribeVoteCast', () => {
  it('sets up VOTE_CAST broadcast listener and calls onVote', () => {
    const subscribeFn = vi.fn()
    let broadcastCallback: (payload: { payload: Record<string, unknown> }) => void = () => {}
    const onFn = vi.fn().mockImplementation((_type: string, _config: unknown, cb: (payload: { payload: Record<string, unknown> }) => void) => {
      broadcastCallback = cb
      return { subscribe: subscribeFn }
    })
    const channelObj = { on: onFn }
    mockChannel.mockReturnValue(channelObj)

    const onVote = vi.fn()
    const unsub = subscribeVoteCast('ABCD', onVote)

    expect(mockChannel).toHaveBeenCalledWith('room-votes:ABCD')
    expect(onFn).toHaveBeenCalledWith('broadcast', { event: 'VOTE_CAST' }, expect.any(Function))
    expect(subscribeFn).toHaveBeenCalledOnce()
    expect(typeof unsub).toBe('function')

    // Simulate receiving a broadcast
    broadcastCallback({ payload: { movie_id: 123, user_id: 'user-1', vote: true } })

    expect(onVote).toHaveBeenCalledWith({ movie_id: 123, user_id: 'user-1', vote: true })
  })
})

describe('broadcastSpinStart', () => {
  it('subscribes to spin channel, sends SPIN_START with event details', async () => {
    const unsubscribeFn = vi.fn()
    const sendFn = vi.fn().mockResolvedValue('ok')
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = broadcastSpinStart('ABCD', 42, 3000)

    subscribeCallback('SUBSCRIBED')

    await resultPromise

    expect(mockChannel).toHaveBeenCalledWith('room-spin:ABCD')
    expect(subscribeFn).toHaveBeenCalledOnce()
    expect(sendFn).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'SPIN_START',
      payload: {
        winner_id: 42,
        duration_ms: 3000,
        start_time: expect.any(String),
      },
    })
    expect(unsubscribeFn).toHaveBeenCalledOnce()
  })

  it('uses default duration of 5000ms when not specified', async () => {
    const unsubscribeFn = vi.fn()
    const sendFn = vi.fn().mockResolvedValue('ok')
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = broadcastSpinStart('ABCD', 7)

    subscribeCallback('SUBSCRIBED')

    await resultPromise

    expect(sendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ duration_ms: 5000 }),
      })
    )
  })

  it('throws on channel error', async () => {
    const unsubscribeFn = vi.fn()
    const sendFn = vi.fn()
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = broadcastSpinStart('ABCD', 42)

    subscribeCallback('CHANNEL_ERROR')

    await expect(resultPromise).rejects.toThrow('Failed to subscribe to spin channel')
    expect(sendFn).not.toHaveBeenCalled()
  })

  it('throws when send returns non-ok', async () => {
    const unsubscribeFn = vi.fn()
    const sendFn = vi.fn().mockResolvedValue('error')
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const resultPromise = broadcastSpinStart('ABCD', 42)

    subscribeCallback('SUBSCRIBED')

    await expect(resultPromise).rejects.toThrow('Failed to broadcast spin')
  })
})
