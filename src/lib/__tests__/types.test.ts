import { describe, it, expect } from 'vitest'
import type { Movie, Room, RoomStatus, Participant, AIRecommendation } from '@/types'

describe('TypeScript interfaces', () => {
  it('Movie type has required fields', () => {
    const movie: Movie = {
      id: 1,
      title: 'Test',
      poster_path: '/test.jpg',
      backdrop_path: null,
      overview: 'A test movie',
      release_date: '2024-01-01',
      vote_average: 7.5,
    }
    expect(movie.id).toBe(1)
    expect(movie.title).toBe('Test')
  })

  it('Room type has required fields', () => {
    const room: Room = {
      id: 'ABCD',
      host_id: 'uuid-here',
      status: 'lobby',
      match_pool: [],
      created_at: '2024-01-01T00:00:00Z',
    }
    expect(room.status).toBe('lobby')
    expect(room.match_pool).toEqual([])
  })

  it('RoomStatus type accepts all valid values', () => {
    const statuses: RoomStatus[] = ['lobby', 'swiping', 'spinning', 'result']
    expect(statuses).toHaveLength(4)
  })

  it('Participant type has required fields', () => {
    const participant: Participant = {
      user_id: 'uuid-here',
      name: 'Test User',
      is_host: true,
      online_at: '2024-01-01T00:00:00Z',
    }
    expect(participant.is_host).toBe(true)
  })

  it('AIRecommendation type has required fields', () => {
    const rec: AIRecommendation = {
      keywords: ['test', 'movie'],
      genre_ids: [28, 12],
      year_range: { min: 2000, max: 2020 },
      sort_by: 'popularity.desc',
    }
    expect(rec.keywords).toHaveLength(2)
    expect(rec.sort_by).toBe('popularity.desc')
  })
})
