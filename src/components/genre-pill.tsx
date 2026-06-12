'use client'

import { cn } from '@/lib/utils'

interface GenrePillProps {
  name: string
  selected: boolean
  onClick: () => void
}

export default function GenrePill({ name, selected, onClick }: GenrePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border',
        selected
          ? 'bg-accent-gold/15 text-accent-gold border-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.15)]'
          : 'bg-transparent text-muted-foreground border-accent-gold/10 hover:border-accent-gold/30 hover:text-foreground'
      )}
    >
      {name}
    </button>
  )
}
