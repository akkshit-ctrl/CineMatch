import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../../api/tmdb/movies/route'

const mockGetMovies = vi.hoisted(() => vi.fn())

vi.mock('@/lib/tmdb', () => ({
  tmdb: {
    getMovies: mockGetMovies,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(url: string): Request {
  return new Request(url)
}

describe('GET /api/tmdb/movies', () => {
  it('parses comma-separated ids and returns movies', async () => {
    mockGetMovies.mockResolvedValue([
      { id: 1, title: 'Movie A' },
      { id: 2, title: 'Movie B' },
    ])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/movies?ids=1,2'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockGetMovies).toHaveBeenCalledWith([1, 2])
    expect(data).toHaveLength(2)
  })

  it('returns 400 when ids param is missing', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/movies'))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toContain('ids')
  })

  it('returns 400 when ids param is empty', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/movies?ids='))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toContain('ids')
  })

  it('returns 400 when all ids are invalid', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/movies?ids=abc,def'))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('No valid movie IDs provided')
  })

  it('filters out invalid ids and only passes valid ones', async () => {
    mockGetMovies.mockResolvedValue([{ id: 1, title: 'Valid' }])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/movies?ids=1,abc,0,-5'))
    const data = await res.json()

    expect(mockGetMovies).toHaveBeenCalledWith([1])
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
  })

  it('returns 500 when tmdb.getMovies throws', async () => {
    mockGetMovies.mockRejectedValue(new Error('API failure'))

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/movies?ids=1,2'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to fetch movies')
  })
})
