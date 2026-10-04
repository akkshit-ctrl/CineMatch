# CineMatch Phase 1 Stabilization Implementation Plan

> **For agentic workers:** Use the executing-plans skill for inline execution, task by task. Do not delegate without explicit user authorization. Steps use checkboxes for tracking.

**Goal:** Make the existing application build and restore dependable navigation, genre loading, name continuation, and consecutive swipes before introducing the new recommendation flow.

**Architecture:** Make focused changes to existing components/pages. Preserve the genre-array API contract and current room API signatures. Isolate tests from external services; document the live backend blockers without granting broad access as a quick fix.

**Tech Stack:** Existing Next.js/React/TypeScript, Framer Motion, Vitest/Testing Library and Playwright.

This is an execution plan, not evidence that its example code or tests have already run. Product behavior is defined in PRODUCT_DESIGN.md. Application changes require a subsequent implementation instruction.

## Task 1: Establish the implementation checkpoint

Files:

- Read RESEARCH_AND_BASELINE.md.
- Read package.json, package-lock.json, supabase/migrations/001_initial_schema.sql.
- Create specs/002-session-recommendations/PHASE_1_CHECKPOINT.md when execution starts.

- [ ] Inspect Git before editing:

~~~powershell
git status --short
git branch --show-current
git rev-parse HEAD
~~~

Expected: understand every existing change. Do not reset or overwrite planning documents or user work. A changed commit or service state requires refreshing the affected baseline, not repeating the whole audit.

- [ ] Run the baseline tests and production build once, recording exact exit status and the first actionable failure:

~~~powershell
npm test
npm run build
~~~

Expected from the recorded baseline: tests pass; build fails on /room because navigation references window. Treat different output as new evidence.

- [ ] Record that live group access remains unverified: missing direct anon table privileges, a live vote uniqueness constraint, plain-insert RPC, and 24-hour cleanup. No remote change in this task.

Checkpoint content:

~~~text
Phase: 1
Local commit:
Existing user changes:
Baseline test result:
Baseline build result:
Live versus local schema differences:
Remote changes: none
Remaining work:
~~~

## Task 2: Browser-safe Solo/Group navigation

Files:

- Modify src/components/bottom-nav.tsx.
- Create src/components/__tests__/bottom-nav.test.tsx.

- [ ] Create this SSR regression test:

~~~tsx
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import BottomNav from '../bottom-nav'

const navigation = vi.hoisted(() => ({
  pathname: '/room',
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}))

describe('BottomNav server rendering', () => {
  it('renders the room route without browser globals', () => {
    navigation.pathname = '/room'
    expect(typeof window).toBe('undefined')
    expect(() => renderToStaticMarkup(<BottomNav />)).not.toThrow()
  })

  it.each(['/', '/room', '/room/ABCD/swipe'])(
    'has clear modes and one active item at %s',
    (pathname) => {
      navigation.pathname = pathname
      const html = renderToStaticMarkup(<BottomNav />)
      expect(html).toContain('aria-label="Solo"')
      expect(html).toContain('aria-label="Group"')
      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    },
  )
})
~~~

- [ ] Verify the test fails before changing the component:

~~~powershell
npm run test -- src/components/__tests__/bottom-nav.test.tsx
~~~

Expected: the /room SSR case exposes window access; mode/active semantics do not yet match the agreed design.

- [ ] Replace the navigation component with this focused implementation, preserving the existing styling direction:

~~~tsx
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

  return (
    <nav aria-label="Movie modes" className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-accent-gold/20">
      <div className="mx-auto max-w-lg flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/'
            ? pathname === '/'
            : pathname === '/room' || pathname.startsWith('/room/')
          return (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              onClick={() => router.push(href)}
              className={'flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-lg transition-all duration-200 ' +
                (active ? 'text-accent-gold' : 'text-muted-foreground hover:text-foreground')}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
~~~

No search-parameter hook or Suspense wrapper is needed: the agreed navigation contains two modes and the Group page contains Create/Join.

- [ ] Rerun the focused test and build:

~~~powershell
npm run test -- src/components/__tests__/bottom-nav.test.tsx
npm run build
~~~

Expected: navigation tests pass; the known window prerender failure disappears. Investigate any remaining build failure instead of declaring production readiness.

## Task 3: Correct genre loading and prove room actions

Files:

- Modify src/app/room/page.tsx.
- Create src/app/room/__tests__/page.test.tsx.
- Read src/app/api/tmdb/genres/route.ts and its existing API test.

- [ ] Create the page-level regressions below. Room APIs are mocked so no database mutation occurs:

~~~tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import RoomPage from '../page'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createRoom: vi.fn(),
  getRoom: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@/lib/room', () => ({
  createRoom: mocks.createRoom,
  getRoom: mocks.getRoom,
}))

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 18, name: 'Drama' }],
  }))
  mocks.createRoom.mockResolvedValue({ id: 'ABCD' })
  mocks.getRoom.mockResolvedValue({ id: 'ABCD' })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Room hub', () => {
  it('renders genres from the existing array contract', async () => {
    render(<RoomPage />)
    expect(await screen.findByRole('button', { name: 'Drama' })).toBeTruthy()
  })

  it('resumes create once with the selected genre after collecting a name', async () => {
    render(<RoomPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Drama' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }))
    expect(mocks.createRoom).not.toHaveBeenCalled()
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Asha' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(mocks.createRoom).toHaveBeenCalledTimes(1))
    expect(mocks.createRoom).toHaveBeenCalledWith(expect.any(String), 18)
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/room/ABCD'))
  })

  it('resumes join with the normalized code after collecting a name', async () => {
    render(<RoomPage />)
    fireEvent.change(screen.getByPlaceholderText('ABCD'), {
      target: { value: 'abcd' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }))
    expect(mocks.getRoom).not.toHaveBeenCalled()
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Ravi' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(mocks.getRoom).toHaveBeenCalledExactlyOnceWith('ABCD'))
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/room/ABCD'))
  })

  it('does not create or join when name collection is cancelled', async () => {
    render(<RoomPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close name prompt' }))
    await waitFor(() => expect(screen.queryByPlaceholderText('Enter your name')).toBeNull())
    expect(mocks.createRoom).not.toHaveBeenCalled()
    expect(mocks.getRoom).not.toHaveBeenCalled()
  })

  it('shows failed genre loading while keeping Any Genre available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<RoomPage />)
    expect(await screen.findByText('Genre filters could not be loaded. You can continue with Any Genre.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Any Genre' })).toBeTruthy()
  })
})
~~~

- [ ] Run the new tests before fixes:

~~~powershell
npm run test -- src/app/room/__tests__/page.test.tsx
~~~

Expected: genre rendering and pending-action cases fail for the recorded reasons.

- [ ] Replace the genre-loading effect, add the separate genreError state, and leave the API's successful array response unchanged:

~~~tsx
const [genreError, setGenreError] = useState('')

useEffect(() => {
  const controller = new AbortController()
  const loadGenres = async () => {
    try {
      const response = await fetch('/api/tmdb/genres', {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Genre request failed')
      const data: unknown = await response.json()
      if (!Array.isArray(data) || !data.every((item) =>
        item && typeof item === 'object' &&
        Number.isInteger(item.id) && item.id > 0 &&
        typeof item.name === 'string'
      )) {
        throw new Error('Invalid genre response')
      }
      if (!controller.signal.aborted) setGenres(data as Genre[])
    } catch {
      if (!controller.signal.aborted) {
        setGenreError('Genre filters could not be loaded. You can continue with Any Genre.')
      }
    }
  }
  void loadGenres()
  return () => controller.abort()
}, [])
~~~

Place this feedback under the genre controls:

~~~tsx
{genreError && <p role="status" className="text-sm text-muted-foreground">{genreError}</p>}
~~~

The single-genre room contract remains unchanged in Phase 1; multi-genre setup arrives with the normalized settings/group schema.

## Task 4: Resume the pending name-gated action exactly once

Files:

- Modify src/app/room/page.tsx.
- Modify src/components/name-prompt-modal.tsx.
- Use the page regressions from Task 3.

- [ ] Add useRef to the existing React import. Declare the action type outside RoomPage:

~~~tsx
type PendingRoomAction =
  | { kind: 'create'; genreId?: number }
  | { kind: 'join'; code: string }
~~~

- [ ] Replace ensureName and the old create/join handler bodies with the following block inside RoomPage:

~~~tsx
const [pendingAction, setPendingAction] = useState<PendingRoomAction | null>(null)
const actionInFlight = useRef(false)

const performAction = async (action: PendingRoomAction) => {
  if (actionInFlight.current) return
  actionInFlight.current = true
  setError('')
  setCreating(action.kind === 'create')
  setJoining(action.kind === 'join')

  try {
    if (action.kind === 'create') {
      const room = await createRoom(generateUserId(), action.genreId)
      router.push('/room/' + room.id)
    } else {
      const room = await getRoom(action.code)
      if (!room) {
        setError('Room not found. Check the code and try again.')
        return
      }
      generateUserId()
      router.push('/room/' + room.id)
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Room action failed. Try again.')
  } finally {
    actionInFlight.current = false
    setCreating(false)
    setJoining(false)
  }
}

const requestAction = (action: PendingRoomAction) => {
  if (actionInFlight.current) return
  if (!sessionStorage.getItem('cinematch_user_name')) {
    setPendingAction(action)
    setShowNamePrompt(true)
    return
  }
  void performAction(action)
}

const handleCreate = () => requestAction({
  kind: 'create',
  genreId: genreId ? Number(genreId) : undefined,
})

const handleJoin = (event: React.FormEvent) => {
  event.preventDefault()
  const code = joinCode.trim().toUpperCase()
  if (code) requestAction({ kind: 'join', code })
}
~~~

Capturing genre/code when the action is requested preserves the intended operation rather than reading changed inputs later. The ref guards repeated invocation before React renders a disabled state.

- [ ] Update the existing modal props:

~~~tsx
<NamePromptModal
  open={showNamePrompt}
  onClose={() => {
    setPendingAction(null)
    setShowNamePrompt(false)
  }}
  onSubmit={(name) => {
    sessionStorage.setItem('cinematch_user_name', name)
    const action = pendingAction
    setPendingAction(null)
    setShowNamePrompt(false)
    if (action) void performAction(action)
  }}
/>
~~~

Disable Create while creating or joining, and Join while creating/joining or code is empty:

~~~text
disabled={creating || joining}
disabled={creating || joining || !joinCode.trim()}
~~~

These are replacements on the two existing Button elements, not two attributes on one element.

- [ ] Add aria-label="Close name prompt" to the modal's existing X button. Full modal focus/Escape behavior remains a Phase 5 task.

- [ ] Run the page tests and retain errors from invalid room codes/provider failure. Extend the regression file with duplicate-click/in-flight coverage if implementation reveals another path:

~~~powershell
npm run test -- src/app/room/__tests__/page.test.tsx src/app/__tests__/api/tmdb/genres.test.ts
~~~

Expected: genre and continuation cases pass; cancellation does not call a room API.

## Task 5: Stop and reset swipe motion

Files:

- Modify src/components/swipe-deck.tsx.
- Create src/components/__tests__/swipe-deck.motion.test.tsx.
- Preserve existing src/components/__tests__/swipe-deck.test.tsx assertions.

- [ ] Create a regression that retains a motion value across card changes:

~~~tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import SwipeDeck from '../swipe-deck'
import type { Movie } from '@/types'

const state = vi.hoisted(() => ({
  value: 0,
  stop: vi.fn(),
  dragEnd: null as null | ((_event: unknown, info: { offset: { x: number } }) => Promise<void>),
}))

vi.mock('framer-motion', async () => {
  const React = await import('react')
  return {
    motion: {
      div: (props: Record<string, unknown>) => {
        if (typeof props.onDragEnd === 'function') {
          state.dragEnd = props.onDragEnd as typeof state.dragEnd
        }
        return React.createElement('div', null, props.children as React.ReactNode)
      },
    },
    useMotionValue: () => React.useMemo(() => ({
      get: () => state.value,
      set: (value: number) => { state.value = value },
      stop: state.stop,
    }), []),
    useTransform: () => 0,
    animate: async (value: { set: (target: number) => void }, target: number) => {
      value.set(target)
    },
  }
})

const movies: Movie[] = [1, 2].map((id) => ({
  id,
  title: 'Motion Movie ' + id,
  poster_path: null,
  backdrop_path: null,
  overview: 'Fixture synopsis',
  release_date: '2020-01-01',
  vote_average: 7,
}))

beforeEach(() => {
  state.value = 0
  state.dragEnd = null
  state.stop.mockClear()
})
afterEach(cleanup)

describe('Swipe motion lifecycle', () => {
  it.each([-180, 180])('centers the next card after an offset of %s', async (offset) => {
    const left = vi.fn()
    const right = vi.fn()
    const view = render(
      <SwipeDeck movies={movies} currentIndex={0} onSwipeLeft={left} onSwipeRight={right} />,
    )
    expect(state.dragEnd).not.toBeNull()
    await act(async () => {
      await state.dragEnd!(undefined, { offset: { x: offset } })
    })
    expect(offset < 0 ? left : right).toHaveBeenCalledExactlyOnceWith(1)
    view.rerender(
      <SwipeDeck movies={movies} currentIndex={1} onSwipeLeft={left} onSwipeRight={right} />,
    )
    expect(screen.getByText('Motion Movie 2')).toBeTruthy()
    expect(state.value).toBe(0)
  })

  it('stops motion when the deck unmounts', () => {
    const view = render(
      <SwipeDeck movies={movies} currentIndex={0} onSwipeLeft={vi.fn()} onSwipeRight={vi.fn()} />,
    )
    state.stop.mockClear()
    view.unmount()
    expect(state.stop).toHaveBeenCalled()
  })
})
~~~

- [ ] Verify failure with the current component:

~~~powershell
npm run test -- src/components/__tests__/swipe-deck.motion.test.tsx
~~~

Expected: the retained motion value is -500 or 500 rather than zero; unmount has no stop cleanup.

- [ ] Import useEffect and add an animation generation ref beside isAnimating. After the x motion value declaration, add:

~~~tsx
const animationGeneration = useRef(0)

useEffect(() => {
  animationGeneration.current += 1
  x.stop()
  x.set(0)
  isAnimating.current = false
  return () => {
    animationGeneration.current += 1
    x.stop()
    isAnimating.current = false
  }
}, [current?.id, x])
~~~

- [ ] Replace handleDragEnd with:

~~~tsx
const handleDragEnd = useCallback(async (_: unknown, info: { offset: { x: number } }) => {
  if (!current || isAnimating.current) return
  const offset = info.offset.x
  if (Math.abs(offset) <= 100) {
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 })
    return
  }

  const generation = animationGeneration.current
  isAnimating.current = true
  try {
    await animate(x, offset < 0 ? -500 : 500, {
      duration: 0.2,
      ease: 'easeOut',
    })
    if (generation !== animationGeneration.current) return
    if (offset < 0) onSwipeLeft(current.id)
    else onSwipeRight(current.id)
  } finally {
    if (generation === animationGeneration.current) {
      x.set(0)
      isAnimating.current = false
    }
  }
}, [current, onSwipeLeft, onSwipeRight, x])
~~~

The generation guard prevents an old animation from voting after its movie/deck has been replaced. Stopping/resetting cannot be delegated to the keyed inner element because the motion value belongs to the parent component.

- [ ] Rerun focused tests:

~~~powershell
npm run test -- src/components/__tests__/swipe-deck.motion.test.tsx src/components/__tests__/swipe-deck.test.tsx
~~~

Existing motion mocks will need a stop mock because the component now calls the real MotionValue.stop API. Add stop: vi.fn() to the existing mocked motion value; preserve its behavior assertions.

Expected: existing rendering and new lifecycle tests pass. Real gesture geometry is checked in Task 7.

## Task 6: Controlled dependency patch

Files:

- Modify package.json and package-lock.json only after inspecting advisories.

- [ ] Recheck relevant official Next.js advisories and current package versions. Version 16.3.8 was confirmed in the registry during planning; if current guidance requires a different patch, document the evidence before substitution.

- [ ] Capture production audit:

~~~powershell
npm audit --omit=dev --json
~~~

An audit nonzero exit indicates reported advisories, not a failed command to suppress.

- [ ] Patch the matching framework/config pair using explicit dependency groups:

~~~powershell
npm install --save-exact next@16.3.8
npm install --save-dev --save-exact eslint-config-next@16.3.8
~~~

Do not upgrade React, install an AI framework, or change unrelated direct dependencies in this task.

- [ ] Inspect lockfile impact and repeat focused checks/full build:

~~~powershell
git diff -- package.json package-lock.json
npm test
npm run lint
npm run build
npm audit --omit=dev
~~~

Expected: the verified framework advisories disappear and behavior remains intact. Trace remaining production advisories to their package chain; apply only justified compatible patches. Do not use audit fix --force or report zero vulnerabilities unless the new output establishes it.

## Task 7: Isolated real-browser regressions

Files:

- Modify playwright.config.ts.
- Replace stale e2e/smoke.spec.ts.

- [ ] Use this configuration so the suite owns a dedicated server:

~~~ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3117',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3117',
    url: 'http://127.0.0.1:3117',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
~~~

Do not kill an unrelated process if the port is occupied. Pick and record another isolated port consistently instead.

- [ ] Replace the stale smoke file with these provider-isolated checks:

~~~ts
import { test, expect } from '@playwright/test'

const userId = '11111111-1111-4111-8111-111111111111'
const movies = [1, 2, 3].map((id) => ({
  id,
  title: 'Fixture Movie ' + id,
  poster_path: null,
  backdrop_path: null,
  overview: 'A sourced fixture synopsis.',
  release_date: '2020-01-01',
  vote_average: 7,
}))
const room = {
  id: 'ABCD',
  host_id: userId,
  status: 'swiping',
  genre_id: 18,
  match_pool: [],
  tmdb_config: {},
  created_at: '2026-10-04T00:00:00Z',
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((id) => {
    sessionStorage.setItem('cinematch_user_id', id)
    sessionStorage.setItem('cinematch_user_name', 'Fixture Guest')
  }, userId)
  await page.routeWebSocket(/wss:\/\/.*\.supabase\.co\/.*/, (socket) => socket.close())
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname.endsWith('.supabase.co')) {
      if (url.pathname === '/rest/v1/rooms') {
        return route.fulfill({ json: room })
      }
      if (url.pathname === '/rest/v1/votes') {
        return route.fulfill({ json: [] })
      }
      if (url.pathname === '/rest/v1/rpc/cast_vote') {
        return route.fulfill({ json: null })
      }
      if (url.pathname === '/realtime/v1/api/broadcast') {
        return route.fulfill({ json: {} })
      }
      return route.abort('blockedbyclient')
    }
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      return route.abort('blockedbyclient')
    }
    if (url.pathname === '/api/tmdb/genres') {
      return route.fulfill({ json: [{ id: 18, name: 'Drama' }] })
    }
    if (url.pathname === '/api/tmdb/discover') {
      return route.fulfill({ json: movies })
    }
    if (url.pathname.startsWith('/api/')) {
      return route.fulfill({ status: 503, json: { error: 'Provider disabled in smoke test' } })
    }
    return route.continue()
  })
})

test('direct room loading and mode navigation work', async ({ page }) => {
  const response = await page.goto('/room')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Room Hub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Drama', exact: true })).toBeVisible()
  const navigation = page.getByRole('navigation', { name: 'Movie modes' })
  await expect(navigation.getByRole('button', { name: 'Group', exact: true })).toHaveAttribute('aria-current', 'page')
  await navigation.getByRole('button', { name: 'Solo', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'CineMatch', exact: true })).toBeVisible()
  await navigation.getByRole('button', { name: 'Group', exact: true }).click()
  await expect(page).toHaveURL(/\/room$/)
})

test('consecutive gesture votes leave the next card onscreen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/room/ABCD/swipe')
  await expect(page.getByRole('heading', { name: 'Fixture Movie 1', exact: true })).toBeVisible()
  for (const [offset, nextTitle] of [[-180, 'Fixture Movie 2'], [180, 'Fixture Movie 3']] as const) {
    const card = page.locator('.cursor-grab').first()
    const before = await card.boundingBox()
    expect(before).not.toBeNull()
    const x = before!.x + before!.width / 2
    const y = before!.y + before!.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + offset, y, { steps: 12 })
    await page.mouse.up()
    await expect(page.getByRole('heading', { name: nextTitle, exact: true })).toBeVisible()
    await expect.poll(async () => {
      const bounds = await page.locator('.cursor-grab').first().boundingBox()
      return bounds ? bounds.x >= -2 && bounds.x + bounds.width <= 392 : false
    }).toBe(true)
  }
})
~~~

This exercise uses fake database/API responses and a closed realtime transport. It proves client gesture geometry and route behavior; it does not prove live Supabase voting/realtime correctness.

- [ ] Run only this suite; do not run the old remote-writing tests:

~~~powershell
npm exec --no -- playwright test e2e/smoke.spec.ts
~~~

Expected: direct routes, navigation, genre display and successive gesture checks pass. If browser binaries are unavailable, report the environment limitation; do not install dependencies or substitute a claimed runtime pass.

## Task 8: Close Phase 1 with evidence

Files:

- Update PHASE_1_CHECKPOINT.md and checkboxes in PHASED_IMPLEMENTATION_PLAN.md only for verified work.

- [ ] Run the final gate sequentially; do not overlap build/test servers:

~~~powershell
npm test
npm run lint
npm run build
npm exec --no -- playwright test e2e/smoke.spec.ts
npm audit --omit=dev
git diff --check
git diff --stat
git status --short
~~~

- [ ] Review the scoped diff for accidental refactors, secrets, weakened tests, dependency churn, invalid browser data access and remote mutations.
- [ ] Record exactly which checks passed, warnings/advisories that remain, and the distinction between mocked UI success and unresolved live backend permissions.
- [ ] Leave changes uncommitted unless the user explicitly requests a commit. Do not push: the linked Vercel project may automatically deploy pushed changes.

Phase 1 completion does not claim the new recommendation system, family-content accuracy, anonymous auth, one-hour expiry or live group synchronization are already implemented. Those belong to their specified later phases.
