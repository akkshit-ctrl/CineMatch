import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SwipeDeck from '../swipe-deck'
import type { Movie } from '@/types'

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: Record<string, unknown>) => {
      const fmProps = new Set(['drag', 'dragConstraints', 'dragElastic', 'whileDrag', 'dragSnapToOrigin', 'onDragEnd', 'onDragStart', 'onDrag', 'layout', 'layoutId', 'animate', 'initial', 'exit', 'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'transition', 'variants', 'style'])
      const sanitized: Record<string, unknown> = {}
      for (const key of Object.keys(props)) {
        if (!fmProps.has(key)) sanitized[key] = props[key]
      }
      return <div {...sanitized} />
    },
  },
  useMotionValue: () => ({
    get: () => 0,
    onChange: vi.fn(),
    set: vi.fn(),
    destroy: vi.fn(),
  }),
  useTransform: () => ({
    get: () => 0,
  }),
  animate: vi.fn().mockResolvedValue(undefined),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} data-fill={fill ? 'true' : 'false'} />
  },
}))

const mockMovie: Movie = {
  id: 1,
  title: 'Test Movie',
  poster_path: '/test.jpg',
  backdrop_path: null,
  overview: 'A great test movie',
  release_date: '2024-06-15',
  vote_average: 8.5,
}

const mockMovies: Movie[] = [
  mockMovie,
  {
    id: 2,
    title: 'Second Movie',
    poster_path: null,
    backdrop_path: null,
    overview: 'No poster here',
    release_date: '2023-01-01',
    vote_average: 6.0,
  },
  {
    id: 3,
    title: 'Third Movie',
    poster_path: null,
    backdrop_path: null,
    overview: 'Third movie overview',
    release_date: '2022-01-01',
    vote_average: 7.0,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SwipeDeck', () => {
  it('renders the current movie with title and rating', () => {
    render(
      <SwipeDeck
        movies={mockMovies}
        currentIndex={0}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )

    expect(screen.getByText('Test Movie')).toBeTruthy()
    expect(screen.getByText('8.5')).toBeTruthy()
    expect(screen.getByText('2024')).toBeTruthy()
    expect(screen.getByText('A great test movie')).toBeTruthy()
  })

  it('renders stacked cards behind the current one', () => {
    render(
      <SwipeDeck
        movies={mockMovies}
        currentIndex={0}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )

    expect(screen.getByText('Test Movie')).toBeTruthy()
    expect(screen.getAllByText('No poster').length).toBe(2)
  })

  it('renders main card with "No poster available" when poster_path is null', () => {
    render(
      <SwipeDeck
        movies={mockMovies}
        currentIndex={1}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )

    expect(screen.getByText('No poster available')).toBeTruthy()
    expect(screen.getByText('Second Movie')).toBeTruthy()
    expect(screen.getByText('6.0')).toBeTruthy()
  })

  it('returns null when no current movie (empty array)', () => {
    const { container } = render(
      <SwipeDeck
        movies={[]}
        currentIndex={0}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )

    expect(container.innerHTML).toBe('')
  })

  it('returns null when currentIndex is out of bounds', () => {
    const { container } = render(
      <SwipeDeck
        movies={mockMovies}
        currentIndex={5}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders NOPE and LIKE indicator badges', () => {
    render(
      <SwipeDeck
        movies={mockMovies}
        currentIndex={0}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )

    const nopeElements = screen.getAllByText('NOPE')
    const likeElements = screen.getAllByText('LIKE')

    expect(nopeElements.length).toBeGreaterThanOrEqual(1)
    expect(likeElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the poster image when poster_path is provided', () => {
    render(
      <SwipeDeck
        movies={mockMovies}
        currentIndex={0}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )

    const img = screen.getByAltText('Test Movie')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('/test.jpg')
  })
})
