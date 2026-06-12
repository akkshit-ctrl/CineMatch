import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../../../api/ai/recommend/route'

const mockCreate = vi.fn()

vi.mock('@/lib/openai', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
  AI_MODEL: 'test-model',
  generateVibePrompt: vi.fn().mockReturnValue('system prompt'),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ai/recommend', () => {
  it('returns 400 for missing vibe', async () => {
    const res = await POST(makeRequest({}))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Vibe description is required')
  })

  it('returns 400 for vibe > 200 chars', async () => {
    const res = await POST(makeRequest({ vibe: 'a'.repeat(201) }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toContain('too long')
  })

  it('returns 502 for invalid JSON from AI', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not json at all' } }],
    })

    const res = await POST(makeRequest({ vibe: 'action movie' }))
    const data = await res.json()

    expect(res.status).toBe(502)
    expect(data.error).toBe('AI returned invalid response')
  })

  it('returns 500 when OpenAI call fails', async () => {
    mockCreate.mockRejectedValue(new Error('OpenAI API error'))

    const res = await POST(makeRequest({ vibe: 'action movie' }))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to generate recommendations')
  })

  it('returns successful AIRecommendation on valid request', async () => {
    const aiResponse = {
      keywords: ['action', 'sci-fi'],
      genre_ids: [28, 878],
      year_range: { min: 2010, max: 2024 },
      sort_by: 'popularity.desc',
    }
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    })

    const res = await POST(makeRequest({ vibe: 'sci-fi action', genre_ids: [28] }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(aiResponse)
  })
})
