'use client'

import { Movie } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface MovieCardProps {
  movie: Movie
}

export default function MovieCard({ movie }: MovieCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.jpg'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full border-0 shadow-lg bg-card/40 hover:bg-card/60 transition-colors cursor-pointer group">
        <div className="relative aspect-[2/3] overflow-hidden">
          {movie.poster_path ? (
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
              No Poster
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <p className="text-white text-sm line-clamp-3">{movie.overview}</p>
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-bold text-lg leading-tight line-clamp-1" title={movie.title}>
            {movie.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{movie.release_date?.split('-')[0] || 'N/A'}</span>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium text-foreground">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
