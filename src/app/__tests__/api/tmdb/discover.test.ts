import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../../api/tmdb/discover/route'

const { mockDiscover, mockResolveKeywords } = vi.hoisted(() => ({
  mockDiscover: vi.fn(),
  mockResolveKeywords: vi.fn(),
}))

vi.mock('@/lib/tmdb', () => ({
  tmdb: {
    discover: mockDiscover,
    resolveKeywords: mockResolveKeywords,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(url: string): Request {
  return new Request(url)
}

describe('GET /api/tmdb/discover', () => {
  it('returns movies with default sort_by when no params given', async () => {
    mockDiscover.mockResolvedValue([{ id: 1, title: 'Movie' }])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(mockDiscover).toHaveBeenCalledWith({ sort_by: 'popularity.desc' })
  })

  it('passes allowed query parameters to tmdb.discover', async () => {
    mockDiscover.mockResolvedValue([{ id: 2, title: 'Filtered' }])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover?with_genres=28&sort_by=vote_average.desc'))

    expect(res.status).toBe(200)
    expect(mockDiscover).toHaveBeenCalledWith({
      with_genres: '28',
      sort_by: 'vote_average.desc',
    })
  })

  it('resolves keyword text to IDs before passing to discover', async () => {
    mockResolveKeywords.mockResolvedValue('123,456')
    mockDiscover.mockResolvedValue([{ id: 3, title: 'Keyword Movie' }])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover?with_keywords=action,comedy'))
    const data = await res.json()

    expect(mockResolveKeywords).toHaveBeenCalledWith(['action', 'comedy'])
    expect(mockDiscover).toHaveBeenCalledWith({
      with_keywords: '123,456',
      sort_by: 'popularity.desc',
    })
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
  })

  it('ignores with_keywords when resolution returns empty', async () => {
    mockResolveKeywords.mockResolvedValue('')
    mockDiscover.mockResolvedValue([{ id: 4, title: 'No keyword match' }])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover?with_keywords=nonexistent'))

    expect(mockDiscover).toHaveBeenCalledWith({
      sort_by: 'popularity.desc',
    })
    expect(res.status).toBe(200)
  })

  it('ignores invalid page parameter', async () => {
    mockDiscover.mockResolvedValue([])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover?page=invalid'))

    expect(mockDiscover).toHaveBeenCalledWith({
      sort_by: 'popularity.desc',
    })
    expect(res.status).toBe(200)
  })

  it('passes valid page parameter', async () => {
    mockDiscover.mockResolvedValue([])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover?page=2'))

    expect(mockDiscover).toHaveBeenCalledWith({
      page: 2,
      sort_by: 'popularity.desc',
    })
    expect(res.status).toBe(200)
  })

  it('ignores unknown query parameters', async () => {
    mockDiscover.mockResolvedValue([])

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover?unknown=foo&with_genres=12'))

    expect(mockDiscover).toHaveBeenCalledWith({
      with_genres: '12',
      sort_by: 'popularity.desc',
    })
    expect(res.status).toBe(200)
  })

  it('returns 500 when tmdb.discover throws', async () => {
    mockDiscover.mockRejectedValue(new Error('API failure'))

    const res = await GET(makeRequest('http://localhost:3000/api/tmdb/discover'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to fetch movies from TMDB')
  })
})
