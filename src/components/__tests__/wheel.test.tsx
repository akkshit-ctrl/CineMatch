import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Wheel from '../wheel'
import type { Movie } from '@/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  animate: vi.fn().mockReturnValue({
    then: vi.fn(),
    cancel: vi.fn(),
  }),
}))

const mockMovies: Movie[] = [
  { id: 1, title: 'Movie A', poster_path: null, backdrop_path: null, overview: '', release_date: '2024', vote_average: 7 },
  { id: 2, title: 'Movie B', poster_path: null, backdrop_path: null, overview: '', release_date: '2024', vote_average: 8 },
  { id: 3, title: 'Movie C', poster_path: null, backdrop_path: null, overview: '', release_date: '2024', vote_average: 9 },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Wheel', () => {
  it('renders movie titles on the wheel segments', () => {
    render(
      <Wheel
        movies={mockMovies}
        winnerId={null}
        spinning={false}
      />
    )

    expect(screen.getByText('Movie A')).toBeTruthy()
    expect(screen.getByText('Movie B')).toBeTruthy()
    expect(screen.getByText('Movie C')).toBeTruthy()
  })

  it('shows empty state when there are no movies', () => {
    render(
      <Wheel
        movies={[]}
        winnerId={null}
        spinning={false}
      />
    )

    expect(screen.getByText('No movies in the pool')).toBeTruthy()
  })

  it('accepts custom durationMs prop', () => {
    render(
      <Wheel
        movies={mockMovies}
        winnerId={null}
        spinning={false}
        durationMs={3000}
      />
    )
    expect(screen.getByText('Movie A')).toBeTruthy()
    expect(screen.getByText('Movie B')).toBeTruthy()
  })
})
