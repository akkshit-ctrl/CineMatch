// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import BottomNav from '../bottom-nav'

const navigationState = vi.hoisted(() => ({
  pathname: '/',
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({ push: navigationState.push }),
}))

describe('BottomNav server rendering', () => {
  it('renders the room route without browser globals', () => {
    navigationState.pathname = '/room'
    expect(typeof window).toBe('undefined')
    expect(() => renderToStaticMarkup(<BottomNav />)).not.toThrow()
  })

  it.each(['/', '/room', '/room/ABCD/swipe'])(
    'renders both modes and exactly one active item at %s',
    (pathname) => {
      navigationState.pathname = pathname
      const html = renderToStaticMarkup(<BottomNav />)

      expect(html).toContain('aria-label="Solo"')
      expect(html).toContain('aria-label="Group"')
      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    },
  )
})
