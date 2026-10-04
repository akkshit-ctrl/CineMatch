import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SwipeDeck from '../swipe-deck'
import type { Movie } from '@/types'

const motionHarness = vi.hoisted(() => {
  let xValue = 0

  const x = {
    get: vi.fn(() => xValue),
    set: vi.fn((value: number) => {
      xValue = value
    }),
    onChange: vi.fn(),
    destroy: vi.fn(),
  }

  const animations: Array<{
    target: number
    promise: Promise<void>
    resolve: () => void
    stop: ReturnType<typeof vi.fn>
  }> = []

  const animate = vi.fn((_value: typeof x, target: number) => {
    x.set(target)
    let resolve!: () => void
    const promise = new Promise<void>((done) => {
      resolve = done
    })
    const stop = vi.fn()
    animations.push({ target, promise, resolve, stop })
    return Object.assign(promise, { stop })
  })

  return {
    x,
    animations,
    animate,
    reset() {
      xValue = 0
      x.get.mockClear()
      x.set.mockClear()
      x.onChange.mockClear()
      x.destroy.mockClear()
      animations.splice(0)
      animate.mockClear()
    },
  }
})

vi.mock('framer-motion', async () => {
  const React = await import('react')

  const MotionDiv = React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => {
    const { children, onDragEnd, ...rest } = props
    const isSwipeCard = typeof onDragEnd === 'function'
    const motionProps = new Set([
      'drag', 'dragConstraints', 'dragElastic', 'whileDrag', 'dragSnapToOrigin',
      'onDragStart', 'onDrag', 'layout', 'layoutId', 'animate', 'initial', 'exit',
      'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'transition', 'variants', 'style',
    ])
    const sanitized = Object.fromEntries(Object.entries(rest).filter(([key]) => !motionProps.has(key)))
    const dispatchDragEnd = (offsetX: number) => {
      void (onDragEnd as (event: unknown, info: { offset: { x: number } }) => unknown)({}, { offset: { x: offsetX } })
    }

    return React.createElement(
      'div',
      {
        ...sanitized,
        ref,
        'data-testid': isSwipeCard ? 'swipe-card' : undefined,
      },
      isSwipeCard
        ? React.createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'swipe-left',
              onClick: () => dispatchDragEnd(-150),
            },
            'Swipe left',
          )
        : null,
      isSwipeCard
        ? React.createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'swipe-right',
              onClick: () => dispatchDragEnd(150),
            },
            'Swipe right',
          )
        : null,
      children as React.ReactNode,
    )
  })
  MotionDiv.displayName = 'MotionDiv'

  return {
    motion: { div: MotionDiv },
    useMotionValue: () => {
      const [value] = React.useState(() => motionHarness.x)
      return value
    },
    useTransform: () => ({ get: () => 0 }),
    animate: motionHarness.animate,
  }
})

vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    default: (props: Record<string, unknown>) => {
      const { fill, alt, ...rest } = props
      return React.createElement('img', {
        ...rest,
        alt: typeof alt === 'string' ? alt : '',
        'data-fill': fill ? 'true' : 'false',
      })
    },
  }
})

const movies: Movie[] = [
  {
    id: 1,
    title: 'First Movie',
    poster_path: null,
    backdrop_path: null,
    overview: 'First overview',
    release_date: '2024-01-01',
    vote_average: 7.5,
  },
  {
    id: 2,
    title: 'Second Movie',
    poster_path: null,
    backdrop_path: null,
    overview: 'Second overview',
    release_date: '2023-01-01',
    vote_average: 8,
  },
]

const renderDeck = (onSwipeLeft = vi.fn(), onSwipeRight = vi.fn(), currentIndex = 0) =>
  render(
    <SwipeDeck
      movies={movies}
      currentIndex={currentIndex}
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
    />,
  )

beforeEach(() => {
  motionHarness.reset()
})

describe('SwipeDeck motion lifecycle', () => {
  it.each([
    { direction: 'left', testId: 'swipe-left', target: -500 },
    { direction: 'right', testId: 'swipe-right', target: 500 },
  ])('resets the retained motion value after a $direction swipe changes movies', async ({ testId, target }) => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const view = renderDeck(onSwipeLeft, onSwipeRight)

    fireEvent.click(screen.getByTestId(testId))
    expect(motionHarness.x.get()).toBe(target)

    await act(async () => {
      motionHarness.animations[0].resolve()
      await motionHarness.animations[0].promise
    })

    if (testId === 'swipe-left') {
      expect(onSwipeLeft).toHaveBeenCalledExactlyOnceWith(1)
      expect(onSwipeRight).not.toHaveBeenCalled()
    } else {
      expect(onSwipeRight).toHaveBeenCalledExactlyOnceWith(1)
      expect(onSwipeLeft).not.toHaveBeenCalled()
    }
    view.rerender(
      <SwipeDeck
        movies={movies}
        currentIndex={1}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />,
    )

    expect(motionHarness.x.get()).toBe(0)
  })

  it('stops the active motion when unmounted', () => {
    const view = renderDeck()
    fireEvent.click(screen.getByTestId('swipe-left'))

    view.unmount()

    expect(motionHarness.animations[0].stop).toHaveBeenCalledOnce()
  })

  it('does not invoke a swipe callback when the movie changes before the animation resolves', async () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const view = renderDeck(onSwipeLeft, onSwipeRight)

    fireEvent.click(screen.getByTestId('swipe-left'))
    view.rerender(
      <SwipeDeck
        movies={movies}
        currentIndex={1}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />,
    )

    await act(async () => {
      motionHarness.animations[0].resolve()
      await motionHarness.animations[0].promise
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('cancels a swipe when its vote callback changes during an animation', async () => {
    const staleCallback = vi.fn()
    const latestCallback = vi.fn()
    const onSwipeRight = vi.fn()
    const view = renderDeck(staleCallback, onSwipeRight)

    fireEvent.click(screen.getByTestId('swipe-left'))
    view.rerender(
      <SwipeDeck
        movies={movies}
        currentIndex={0}
        onSwipeLeft={latestCallback}
        onSwipeRight={onSwipeRight}
      />,
    )

    await act(async () => {
      motionHarness.animations[0].resolve()
      await motionHarness.animations[0].promise
    })

    expect(staleCallback).not.toHaveBeenCalled()
    expect(latestCallback).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(motionHarness.animations[0].stop).toHaveBeenCalledOnce()
  })

  it('does not invoke a swipe callback when unmounted before the animation resolves', async () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const view = renderDeck(onSwipeLeft, onSwipeRight)

    fireEvent.click(screen.getByTestId('swipe-right'))
    view.unmount()

    await act(async () => {
      motionHarness.animations[0].resolve()
      await motionHarness.animations[0].promise
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })
})
