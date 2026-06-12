'use client'

import { useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, animate, useMotionValue, useTransform } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Movie, OMDBRatings } from '@/types'
import RatingBadge from '@/components/rating-badge'

interface MovieHeroProps {
  movie: Movie
  omdbRatings?: OMDBRatings | null
  genres?: string[]
  currentIndex: number
  totalCount: number
  saved: boolean
  onSave: () => void
  onSkip: () => void
  onSwipeEnd: () => void
}

const SWIPE_THRESHOLD = 100

export default function MovieHero({
  movie,
  omdbRatings,
  genres,
  currentIndex,
  totalCount,
  saved,
  onSave,
  onSkip,
  onSwipeEnd,
}: MovieHeroProps) {
  const x = useMotionValue(0)
  const isAnimating = useRef(false)
  const rightBadgeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const leftBadgeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (isAnimating.current) return

      if (Math.abs(info.offset.x) >= SWIPE_THRESHOLD) {
        isAnimating.current = true
        const targetX = info.offset.x > 0 ? 500 : -500
        animate(x, targetX, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          onComplete: () => {
            if (info.offset.x > 0) {
              onSave()
            } else {
              onSkip()
            }
            onSwipeEnd()
            isAnimating.current = false
          },
        })
      } else {
        animate(x, 0, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        })
      }
    },
    [x, onSave, onSkip, onSwipeEnd],
  )

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null

  const year = movie.release_date?.split('-')[0]

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      style={{ x }}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-sm mx-auto"
    >
      <motion.div
        style={{ opacity: rightBadgeOpacity }}
        className="absolute top-8 right-8 z-20 rotate-12 rounded-lg border-2 border-accent-gold bg-background/80 px-4 py-2 text-lg font-bold text-accent-gold backdrop-blur-sm pointer-events-none"
      >
        SAVE
      </motion.div>

      <motion.div
        style={{ opacity: leftBadgeOpacity }}
        className="absolute top-8 left-8 z-20 -rotate-12 rounded-lg border-2 border-muted-foreground bg-background/80 px-4 py-2 text-lg font-bold text-muted-foreground backdrop-blur-sm pointer-events-none"
      >
        SKIP
      </motion.div>

      <div className="relative aspect-[2/3] rounded-t-lg overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 400px) 100vw, 384px"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
            No poster available
          </div>
        )}
      </div>

      <div className="bg-surface rounded-b-lg p-6 space-y-3">
        <h2 className="font-display text-2xl text-foreground text-center leading-tight">
          {movie.title}
        </h2>

        <RatingBadge
          tmdbRating={movie.vote_average}
          imdbRating={omdbRatings?.imdb}
          rtRating={omdbRatings?.rt}
          year={year}
        />

        {genres && genres.length > 0 && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {movie.overview && (
          <p className="text-secondary text-sm text-center line-clamp-2">
            {movie.overview}
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {currentIndex + 1} of {totalCount}
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={onSave}
            className={cn(
              'flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200 border',
              saved
                ? 'bg-accent-gold text-background border-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                : 'bg-transparent text-accent-gold border-accent-gold/30 hover:border-accent-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.15)]',
            )}
          >
            {saved ? (
              <>
                <Heart className="w-4 h-4 fill-current" />
                Saved
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                Save
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-muted-foreground border border-border/30 hover:border-muted-foreground/30 hover:text-foreground transition-all duration-200 bg-transparent"
          >
            <X className="w-4 h-4" />
            Skip
          </button>
        </div>
      </div>
    </motion.div>
  )
}
