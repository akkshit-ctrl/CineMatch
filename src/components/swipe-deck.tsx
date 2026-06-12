'use client'

import React, { useCallback, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import Image from 'next/image'
import { Star } from 'lucide-react'
import type { Movie } from '@/types'

const IMG_BASE = 'https://image.tmdb.org/t/p/w500'

interface SwipeDeckProps {
  movies: Movie[]
  currentIndex: number
  onSwipeLeft: (movieId: number) => void
  onSwipeRight: (movieId: number) => void
}

const SwipeDeck = React.memo(function SwipeDeck({ movies, currentIndex, onSwipeLeft, onSwipeRight }: SwipeDeckProps) {
  const current = movies[currentIndex]
  const nextMovies = movies.slice(currentIndex + 1, currentIndex + 3)
  const isAnimating = useRef(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15])

  const nopeOpacity = useTransform(x, (v: number) => {
    if (v >= -100) return 0
    return Math.min(1, (-v - 100) / 100)
  })

  const likeOpacity = useTransform(x, (v: number) => {
    if (v <= 100) return 0
    return Math.min(1, (v - 100) / 100)
  })

  const handleDragEnd = useCallback(async (_: unknown, info: { offset: { x: number } }) => {
    if (!current || isAnimating.current) return

    const offset = info.offset.x
    if (offset < -100) {
      isAnimating.current = true
      await animate(x, -500, { duration: 0.2, ease: 'easeOut' })
      isAnimating.current = false
      onSwipeLeft(current.id)
    } else if (offset > 100) {
      isAnimating.current = true
      await animate(x, 500, { duration: 0.2, ease: 'easeOut' })
      isAnimating.current = false
      onSwipeRight(current.id)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 })
    }
  }, [current, onSwipeLeft, onSwipeRight, x])

  if (!current) return null

  return (
    <div className="relative aspect-[2/3] w-full">
      {nextMovies.map((movie, i) => {
        const scale = 1 - (i + 1) * 0.05
        const translateY = (i + 1) * 8
        return (
          <div
            key={movie.id}
            className="absolute inset-0 rounded-lg overflow-hidden border border-primary/10 bg-card/30"
            style={{
              transform: `scale(${scale}) translateY(${translateY}px)`,
              zIndex: 5 - (i + 1),
            }}
          >
            {movie.poster_path ? (
              <Image
                src={`${IMG_BASE}${movie.poster_path}`}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="500px"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted">
                <p className="text-muted-foreground text-sm">No poster</p>
              </div>
            )}
          </div>
        )
      })}

      <motion.div
        key={current.id}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="w-full h-full rounded-lg overflow-hidden border border-primary/20 bg-card/50 backdrop-blur-sm">
          <div className="relative w-full h-full">
            {current.poster_path ? (
              <Image
                src={`${IMG_BASE}${current.poster_path}`}
                alt={current.title}
                fill
                className="object-cover pointer-events-none"
                sizes="500px"
                draggable={false}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted">
                <p className="text-muted-foreground">No poster available</p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16 pointer-events-none">
              <h2 className="text-xl font-bold text-white">{current.title}</h2>
              <div className="flex items-center gap-3 text-sm text-white/80 mt-1">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {current.vote_average.toFixed(1)}
                </span>
                <span>{current.release_date?.slice(0, 4)}</span>
              </div>
              <p className="text-xs text-white/60 mt-2 line-clamp-3">{current.overview}</p>
            </div>

            <motion.div
              className="absolute top-8 right-8 border-[3px] border-red-500 rounded-lg px-3 py-1.5 -rotate-[15deg] pointer-events-none"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-red-500 text-2xl font-extrabold tracking-wider select-none">NOPE</span>
            </motion.div>

            <motion.div
              className="absolute top-8 left-8 border-[3px] border-green-500 rounded-lg px-3 py-1.5 rotate-[15deg] pointer-events-none"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-green-500 text-2xl font-extrabold tracking-wider select-none">LIKE</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
})

export default SwipeDeck
