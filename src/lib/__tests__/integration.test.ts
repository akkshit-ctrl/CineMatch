import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Solo Mode Integration: AI Recommend -> TMDB Discover ---

const mockCreate = vi.fn()
const mockDiscover = vi.fn()

vi.mock('@/lib/openai', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: { create: mockCreate },
    },
  })),
  AI_MODEL: 'test-model',
  generateVibePrompt: vi.fn((vibe: string) => 'prompt for: ' + vibe),
}))

vi.mock('@/lib/tmdb', () => ({
  tmdb: {
    discover: mockDiscover,
  },
}))

async function getRecommendation(body: Record<string, unknown>) {
  const { POST } = await import('@/app/api/ai/recommend/route')
  const req = new Request('http://localhost:3000/api/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST(req)
}

async function getDiscoverMovies(params: string) {
  const { GET } = await import('@/app/api/tmdb/discover/route')
  const url = 'http://localhost:3000/api/tmdb/discover?' + params
  const req = new Request(url)
  return GET(req)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Solo Mode Integration: AI to TMDB Discover', () => {
  it('flows through: AI recommend returns keywords, TMDB discover uses them', async () => {
    // Step 1: AI recommends based on vibe
    const aiResponse = {
      keywords: ['action', 'sci-fi'],
      genre_ids: [28, 878],
      year_range: { min: 2010, max: 2024 },
      sort_by: 'popularity.desc',
    }
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    })

    const recRes = await getRecommendation({ vibe: 'sci-fi action' })
    const recommendation = await recRes.json()

    expect(recRes.status).toBe(200)
    expect(recommendation.keywords).toEqual(['action', 'sci-fi'])

    // Step 2: Use the recommendation to discover movies
    const discoverParams = new URLSearchParams({
      with_genres: recommendation.genre_ids.join(','),
      sort_by: recommendation.sort_by,
      'primary_release_date.gte': String(recommendation.year_range.min),
      'primary_release_date.lte': String(recommendation.year_range.max),
    }).toString()

    const mockMovies = [
      { id: 1, title: 'Result Movie', overview: '', poster_path: null, backdrop_path: null, release_date: '2022', vote_average: 7, genre_ids: [28] },
    ]
    mockDiscover.mockResolvedValue(mockMovies)

    const discoverRes = await getDiscoverMovies(discoverParams)
    const movies = await discoverRes.json()

    expect(discoverRes.status).toBe(200)
    expect(movies).toHaveLength(1)
    expect(movies[0].title).toBe('Result Movie')

    // Verify the discover was called with params derived from AI recommendation
    expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({
        with_genres: '28,878',
        sort_by: 'popularity.desc',
      })
    )
  })

  it('handles empty AI recommendation gracefully in discover flow', async () => {
    // AI returns empty keywords
    const aiResponse = {
      keywords: [],
      genre_ids: [],
      year_range: { min: 2000, max: 2024 },
      sort_by: 'popularity.desc',
    }
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    })

    const recRes = await getRecommendation({ vibe: 'anything' })
    const recommendation = await recRes.json()

    expect(recRes.status).toBe(200)
    expect(recommendation.keywords).toEqual([])
  })
})

// --- Room Flow Integration: Create -> Vote -> Match -> Spin ---

const mockFrom = vi.fn()
const mockChannel = vi.fn()
const mockSupabase = {
  from: mockFrom,
  channel: mockChannel,
}

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => mockSupabase,
}))

describe('Room Flow: Create, Vote, CalculateMatch, BroadcastSpin', () => {
  it('creates a room, casts votes, calculates match pool, broadcasts spin start', async () => {
    // 1. Create room
    const insertResult = { id: 'ROOM', host_id: 'host-1', status: 'lobby', genre_id: 28, match_pool: [], created_at: '2024-01-01T00:00:00Z' }
    const singleFn = vi.fn().mockResolvedValue({ data: insertResult, error: null })
    const selectFn = vi.fn().mockReturnValue({ single: singleFn })
    const insertFn = vi.fn().mockReturnValue({ select: selectFn })
    mockFrom.mockReturnValue({ insert: insertFn })

    const { createRoom } = await import('@/lib/room')
    const room = await createRoom('host-1', 28)

    expect(room.id).toBe('ROOM')
    expect(room.status).toBe('lobby')

    // 2. Cast votes
    const insertVoteFn = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertVoteFn })

    const { castVote } = await import('@/lib/room')
    await castVote('ROOM', 'user-1', 101, true)
    await castVote('ROOM', 'user-1', 102, false)
    await castVote('ROOM', 'user-2', 101, true)
    await castVote('ROOM', 'user-2', 102, true)

    expect(insertVoteFn).toHaveBeenCalledTimes(4)

    // 3. Calculate match pool (51% threshold)
    const mockVotes = [
      { movie_id: 101, vote: true },
      { movie_id: 101, vote: true },
      { movie_id: 102, vote: false },
      { movie_id: 102, vote: true },
    ]
    const eqUpdateFn = vi.fn().mockResolvedValue({ error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: eqUpdateFn })
    const eqVotesFn = vi.fn().mockResolvedValue({ data: mockVotes, error: null })

    mockFrom
      .mockReset()
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: eqVotesFn }) })
      .mockReturnValueOnce({ update: updateFn })

    const { calculateMatchPool } = await import('@/lib/room')
    const matched = await calculateMatchPool('ROOM')

    // movie 101: 2 yes / 2 total = 100% >= 51%
    // movie 102: 1 yes / 2 total = 50% < 51%
    expect(matched).toEqual([101])

    // 4. Broadcast spin start
    const sendFn = vi.fn().mockResolvedValue('ok')
    let subscribeCallback: (status: string) => void = () => {}
    const subscribeFn = vi.fn().mockImplementation((cb: (status: string) => void) => { subscribeCallback = cb })
    const unsubscribeFn = vi.fn()
    const channelObj = { subscribe: subscribeFn, send: sendFn, unsubscribe: unsubscribeFn }
    mockChannel.mockReturnValue(channelObj)

    const { broadcastSpinStart } = await import('@/lib/room')
    const spinPromise = broadcastSpinStart('ROOM', 101, 5000)

    subscribeCallback('SUBSCRIBED')
    await spinPromise

    expect(sendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'broadcast',
        event: 'SPIN_START',
        payload: expect.objectContaining({
          winner_id: 101,
          duration_ms: 5000,
        }),
      })
    )
    expect(unsubscribeFn).toHaveBeenCalledOnce()
  })
})
