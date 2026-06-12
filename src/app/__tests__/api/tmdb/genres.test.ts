import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

let GET: typeof import('../../../api/tmdb/genres/route').GET

beforeEach(async () => {
  vi.clearAllMocks()
  vi.stubEnv('TMDB_API_KEY', 'test-key')
  // Reset modules to clear the module-level cache in genres/route.ts
  vi.resetModules()
  const mod = await import('../../../api/tmdb/genres/route')
  GET = mod.GET
})

function mockResponse(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  })
}

describe('GET /api/tmdb/genres', () => {
  it('fetches and returns genre list from TMDB', async () => {
    const genreData = { genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }] }
    mockFetch.mockResolvedValue(mockResponse(genreData))

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual([{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }])
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/genre/movie/list?api_key=test-key&language=en-US'
    )
  })

  it('returns cached genres on subsequent calls within TTL', async () => {
    const genreData = { genres: [{ id: 28, name: 'Action' }] }
    mockFetch.mockResolvedValue(mockResponse(genreData))

    // First call
    const res1 = await GET()
    expect(res1.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Second call — should use cache
    const res2 = await GET()
    const data2 = await res2.json()
    expect(res2.status).toBe(200)
    expect(data2).toEqual([{ id: 28, name: 'Action' }])
    // fetch should not be called again
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when TMDB API key is missing', async () => {
    vi.stubEnv('TMDB_API_KEY', '')

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Missing TMDB_API_KEY')
  })

  it('returns 500 when TMDB API call fails', async () => {
    mockFetch.mockResolvedValue(mockResponse(null, false, 500))

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to fetch genres from TMDB')
  })
})
