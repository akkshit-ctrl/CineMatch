'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Clapperboard, Users } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Solo', icon: Clapperboard },
  { href: '/room', label: 'Group', icon: Users },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  return (
    <nav aria-label="Movie modes" className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-accent-gold/20">
      <div className="mx-auto max-w-lg flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <button
              key={label}
              type="button"
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? 'text-accent-gold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : ''}`} />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
