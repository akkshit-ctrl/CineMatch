'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingBadgeProps {
  tmdbRating?: number
  imdbRating?: string
  rtRating?: string
  year?: string
  className?: string
}

export default function RatingBadge({ tmdbRating, imdbRating, rtRating, year, className }: RatingBadgeProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 flex-wrap text-sm text-muted-foreground', className)}>
      {tmdbRating !== undefined && (
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-accent-gold text-accent-gold" />
          <span>{tmdbRating.toFixed(1)}</span>
        </span>
      )}
      {imdbRating && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground/70">IMDb</span>
            <span>{imdbRating}</span>
          </span>
        </>
      )}
      {rtRating && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground/70">RT</span>
            <span>{rtRating}</span>
          </span>
        </>
      )}
      {year && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span>{year}</span>
        </>
      )}
    </div>
  )
}
