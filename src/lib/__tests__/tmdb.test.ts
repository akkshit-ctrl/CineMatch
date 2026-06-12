import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tmdb } from '../tmdb'

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

describe('tmdb.getMovie', () => {
  it('fetches a single movie', async () => {
    const movieData = { id: 550, title: 'Fight Club', overview: '...', poster_path: '/abc.jpg', backdrop_path: null, release_date: '1999-10-15', vote_average: 8.4, genre_ids: [18] }
    mockFetch.mockResolvedValue(mockResponse(movieData))

    const result = await tmdb.getMovie(550)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/550?api_key=test-key&language=en-US'
    )
    expect(result).toEqual(movieData)
  })

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValue(mockResponse(null, false, 404))

    const result = await tmdb.getMovie(99999)
    expect(result).toBeNull()
  })
})

describe('tmdb.getMovies', () => {
  it('fetches multiple movies sequentially, handles partial failures', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ id: 1, title: 'A', overview: '', poster_path: null, backdrop_path: null, release_date: '2000', vote_average: 5, genre_ids: [] }))
      .mockResolvedValueOnce(mockResponse(null, false, 404))
      .mockResolvedValueOnce(mockResponse({ id: 3, title: 'C', overview: '', poster_path: null, backdrop_path: null, release_date: '2000', vote_average: 5, genre_ids: [] }))

    const results = await tmdb.getMovies([1, 2, 3])

    expect(results).toHaveLength(2)
    expect(results[0].id).toBe(1)
    expect(results[1].id).toBe(3)
  })
})

describe('tmdb.discover', () => {
  it('builds correct URL from params', async () => {
    const discoverData = { results: [{ id: 1, title: 'Movie', overview: '', poster_path: null, backdrop_path: null, release_date: '2020', vote_average: 7, genre_ids: [28] }] }
    mockFetch.mockResolvedValue(mockResponse(discoverData))

    const results = await tmdb.discover({ with_genres: '28', sort_by: 'popularity.desc' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('discover/movie')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('with_genres=28')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('sort_by=popularity.desc')
    )
    expect(results).toHaveLength(1)
  })

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue(mockResponse(null, false, 500))

    await expect(tmdb.discover({})).rejects.toThrow('TMDB API Error (500)')
  })
})

describe('tmdb.searchKeyword', () => {
  it('searches and returns first result', async () => {
    const keywordData = { results: [{ id: 123, name: 'sci-fi' }] }
    mockFetch.mockResolvedValue(mockResponse(keywordData))

    const result = await tmdb.searchKeyword('sci-fi')

    expect(result).toEqual({ id: 123, name: 'sci-fi' })
  })

  it('returns null when no results', async () => {
    const keywordData = { results: [] }
    mockFetch.mockResolvedValue(mockResponse(keywordData))

    const result = await tmdb.searchKeyword('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null when TMDB API returns non-ok status', async () => {
    mockFetch.mockResolvedValue(mockResponse(null, false, 500))

    const result = await tmdb.searchKeyword('error-keyword')

    expect(result).toBeNull()
  })

  it('encodes the query parameter', async () => {
    mockFetch.mockResolvedValue(mockResponse({ results: [{ id: 1, name: 'sci fi' }] }))

    await tmdb.searchKeyword('sci fi')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('sci fi'))
    )
  })
})

describe('tmdb.resolveKeywords', () => {
  it('resolves multiple keywords to comma-separated IDs', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ results: [{ id: 1, name: 'action' }] }))
      .mockResolvedValueOnce(mockResponse({ results: [{ id: 2, name: 'comedy' }] }))

    const result = await tmdb.resolveKeywords(['action', 'comedy'])

    expect(result).toBe('1,2')
  })

  it('handles empty/no-match gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ results: [] }))
      .mockResolvedValueOnce(mockResponse({ results: [{ id: 5, name: 'drama' }] }))

    const result = await tmdb.resolveKeywords(['unknown', 'drama'])

    expect(result).toBe('5')
  })

  it('returns empty string for empty input', async () => {
    const result = await tmdb.resolveKeywords([])
    expect(result).toBe('')
  })

  it('returns empty string when all keywords fail to resolve', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ results: [] }))
      .mockResolvedValueOnce(mockResponse({ results: [] }))
      .mockResolvedValueOnce(mockResponse({ results: [] }))

    const result = await tmdb.resolveKeywords(['unknown1', 'unknown2', 'unknown3'])

    expect(result).toBe('')
  })

  it('handles TMDB API returning null (non-ok) for a keyword search', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(null, false, 500))
      .mockResolvedValueOnce(mockResponse({ results: [{ id: 10, name: 'found' }] }))

    const result = await tmdb.resolveKeywords(['broken', 'found'])

    expect(result).toBe('10')
  })
})
