import { expect, test } from '@playwright/test'

const userId = '11111111-1111-4111-8111-111111111111'
const movies = [1, 2, 3].map((id) => ({
  id,
  title: `Fixture Movie ${id}`,
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

  await page.routeWebSocket(/wss:\/\/[^/]+\.supabase\.co\/.*/, (socket) => socket.close())
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
  await expect(navigation.getByRole('button', { name: 'Group', exact: true }))
    .toHaveAttribute('aria-current', 'page')
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
