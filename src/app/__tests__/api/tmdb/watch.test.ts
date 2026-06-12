import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../../api/tmdb/watch/route'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('TMDB_API_KEY', 'test-key')
})

function mockResponse(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  })
}

describe('GET /api/tmdb/watch', () => {
  it('returns flatrate providers for a movie ID', async () => {
    const watchData = {
      results: {
        US: { flatrate: [{ provider_name: 'Netflix', logo_path: '/netflix.png', display_priority: 1 }] },
      },
    }
    mockFetch.mockResolvedValue(mockResponse(watchData))

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/watch?movieId=550'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.providers).toHaveLength(1)
    expect(data.providers[0].provider_name).toBe('Netflix')
  })

  it('tries multiple regions in order (US, CA, GB, AU)', async () => {
    const watchData = {
      results: {
        US: {},
        CA: { flatrate: [{ provider_name: 'Prime Video', logo_path: '/prime.png', display_priority: 2 }] },
      },
    }
    mockFetch.mockResolvedValue(mockResponse(watchData))

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/watch?movieId=550'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.providers).toHaveLength(1)
    expect(data.providers[0].provider_name).toBe('Prime Video')
  })

  it('returns 400 when movieId is missing', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/watch'))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('movieId query parameter is required')
  })

  it('returns 500 when TMDB API key is missing', async () => {
    vi.stubEnv('TMDB_API_KEY', '')

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/watch?movieId=550'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to fetch watch providers')
  })

  it('returns 500 when TMDB API call fails', async () => {
    mockFetch.mockResolvedValue(mockResponse(null, false, 500))

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/watch?movieId=550'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to fetch watch providers')
  })

  it('returns empty providers array when no region has flatrate', async () => {
    const watchData = {
      results: {
        US: { rent: [{ provider_name: 'Apple TV', logo_path: '/apple.png', display_priority: 3 }] },
      },
    }
    mockFetch.mockResolvedValue(mockResponse(watchData))

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/watch?movieId=550'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.providers).toEqual([])
  })
})

function makeRequest(url: string): Request {
  return new Request(url)
}
