import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MovieCard from '../movie-card'
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
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} data-fill={fill ? 'true' : 'false'} />
  },
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: Record<string, unknown>) => {
    return <div data-testid="card" {...props as Record<string, string>}>{children as React.ReactNode}</div>
  },
  CardContent: ({ children, ...props }: Record<string, unknown>) => {
    return <div data-testid="card-content" {...props as Record<string, string>}>{children as React.ReactNode}</div>
  },
}))

const baseMovie: Movie = {
  id: 1,
  title: 'Test Movie',
  poster_path: '/test.jpg',
  backdrop_path: null,
  overview: 'A test movie overview',
  release_date: '2024-06-15',
  vote_average: 8.5,
}

describe('MovieCard', () => {
  it('renders movie title and rating', () => {
    render(<MovieCard movie={baseMovie} />)
    expect(screen.getByText('Test Movie')).toBeTruthy()
    expect(screen.getByText('8.5')).toBeTruthy()
    expect(screen.getByText('2024')).toBeTruthy()
  })

  it('renders movie poster when poster_path is provided', () => {
    render(<MovieCard movie={baseMovie} />)
    const img = screen.getByAltText('Test Movie')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('/test.jpg')
  })

  it('shows "No Poster" when poster_path is null', () => {
    const movie = { ...baseMovie, poster_path: null }
    render(<MovieCard movie={movie} />)
    expect(screen.getByText('No Poster')).toBeTruthy()
  })

  it('shows "N/A" for missing release year', () => {
    const movie = { ...baseMovie, release_date: '' }
    render(<MovieCard movie={movie} />)
    expect(screen.getByText('N/A')).toBeTruthy()
  })

  it('displays overview on hover', () => {
    render(<MovieCard movie={baseMovie} />)
    expect(screen.getByText('A test movie overview')).toBeTruthy()
  })
})
