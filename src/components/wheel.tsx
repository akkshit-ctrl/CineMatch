'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { Movie } from '@/types'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
]

interface WheelProps {
  movies: Movie[]
  winnerId: number | null
  spinning: boolean
  durationMs?: number
  onSpinEnd?: () => void
}

export default function Wheel({ movies, winnerId, spinning, durationMs = 5000, onSpinEnd }: WheelProps) {
  const [rotation, setRotation] = useState(0)
  const spinStartedRef = useRef(false)

  const segmentAngle = 360 / movies.length

  useEffect(() => {
    if (spinning && winnerId && !spinStartedRef.current) {
      spinStartedRef.current = true

      const winnerIndex = movies.findIndex((m) => m.id === winnerId)
      if (winnerIndex === -1) return

      const targetAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2)
      const fullSpins = 5 * 360
      const totalRotation = rotation + fullSpins + targetAngle - (rotation % 360)

      animate(rotation, totalRotation, {
        duration: durationMs / 1000,
        ease: [0.15, 0.85, 0.25, 1],
        onUpdate: (latest) => setRotation(latest),
        onComplete: () => {
          spinStartedRef.current = false
          onSpinEnd?.()
        },
      })
    }
  }, [spinning, winnerId, movies, segmentAngle, rotation, durationMs, onSpinEnd])

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center w-72 h-72 rounded-full bg-muted/50 text-muted-foreground">
        No movies in the pool
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
      </div>
      <motion.div
        className="relative w-72 h-72 rounded-full overflow-hidden shadow-2xl border-4 border-border"
        style={{
          rotate: rotation,
          background: `conic-gradient(${movies.map(
            (m, i) =>
              `${COLORS[i % COLORS.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
          ).join(', ')})`,
        }}
      >
        {movies.map((movie, i) => {
          const midAngle = (i * segmentAngle + segmentAngle / 2) * (Math.PI / 180)
          const radius = 100
          const textRadius = radius * 0.55
          const x = 50 + textRadius * Math.sin(midAngle)
          const y = 50 - textRadius * Math.cos(midAngle)

          return (
            <div
              key={movie.id}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span
                className="absolute text-xs font-bold text-white drop-shadow-lg truncate px-2"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  maxWidth: `${segmentAngle < 60 ? '70px' : '90px'}`,
                  textAlign: 'center',
                  rotate: `${-rotation}deg`,
                }}
              >
                {movie.title}
              </span>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
