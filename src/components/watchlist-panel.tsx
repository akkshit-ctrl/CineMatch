'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Movie } from '@/types'

const IMG_BASE = 'https://image.tmdb.org/t/p/w500'

interface WatchlistPanelProps {
  savedMovies: Movie[]
  onSelect: (movie: Movie) => void
  onRemove: (movieId: number) => void
}

export default function WatchlistPanel({ savedMovies, onSelect, onRemove }: WatchlistPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="border-t border-accent-gold/10 pt-4 mt-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="font-display text-foreground text-lg">
          Your Watchlist ({savedMovies.length})
        </h2>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {!open ? null : savedMovies.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-3">No saved movies yet</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto mt-3 pb-2">
          {savedMovies.map((movie) => (
            <div
              key={movie.id}
              className="relative shrink-0 cursor-pointer group"
              onClick={() => onSelect(movie)}
            >
              <div className="relative w-16 h-24 rounded-md overflow-hidden">
                {movie.poster_path ? (
                  <Image
                    src={`${IMG_BASE}${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">N/A</span>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(movie.id)
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {savedMovies.length > 0 && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs bg-accent-gold/15 text-accent-gold rounded-full px-2 py-0.5">
            {savedMovies.length}
          </span>
        </div>
      )}
    </section>
  )
}
