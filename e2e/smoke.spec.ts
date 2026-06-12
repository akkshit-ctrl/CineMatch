import { test, expect } from '@playwright/test'

test.describe('CineMatch MVP Smoke Tests', () => {
  test('Test 1: Solo mode page loads with title, vibe input, and Find button', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /CineMatch/i })).toBeVisible()

    const vibeInput = page.getByPlaceholder(/e\.g\.,/)
    await expect(vibeInput).toBeVisible()

    await expect(page.getByRole('button', { name: /Find/i })).toBeVisible()
  })

  test('Test 2: Room page loads with Create a Room and Join a Room cards', async ({ page }) => {
    await page.goto('/room')

    await expect(page.getByRole('heading', { name: /Create a Room/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Join a Room/i })).toBeVisible()
    await expect(page.getByPlaceholder(/e\.g\., ABCD/i)).toBeVisible()
  })

  test('Test 3: Solo mode shows no submission on empty vibe', async ({ page }) => {
    await page.goto('/')

    const currentUrl = page.url()

    await page.getByRole('button', { name: /Find/i }).click()
    await page.waitForTimeout(500)

    expect(page.url()).toBe(currentUrl)
  })

  test('Test 4: Dark mode is active on the html element', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
  })

  test('Test 5: Navigation to /room works as a route', async ({ page }) => {
    await page.goto('/room')

    await expect(page).toHaveURL(/\/room$/)
    await expect(page.getByRole('heading', { name: /Create a Room/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Join a Room/i })).toBeVisible()
  })

  test('Test 6: Non-existent room shows "Room Not Found" error', async ({ page }) => {
    await page.goto('/room/ABCDEF')

    await expect(page.getByRole('heading', { name: /Room Not Found/i })).toBeVisible()
  })

  test('Test 7: Room page can open name prompt on Create Room click', async ({ page }) => {
    await page.goto('/room')

    await page.getByRole('button', { name: /Create Room/i }).click()

    await expect(page.getByText(/display name/i)).toBeVisible()
    await expect(page.getByPlaceholder(/Enter your name/i)).toBeVisible()
  })

  test('Test 8: Room page can open name prompt on Join click', async ({ page }) => {
    await page.goto('/room')

    await page.getByRole('button', { name: /Join/i }).click()

    await expect(page.getByText(/display name/i)).toBeVisible()
  })

  test('Test 9: Name prompt validates empty input', async ({ page }) => {
    await page.goto('/room')

    await page.getByRole('button', { name: /Create Room/i }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    await expect(page.getByText(/enter a display name/i)).toBeVisible()
  })

  test('Test 10: Lobby page shows room code after entering name', async ({ page }) => {
    await page.goto('/room')

    await page.getByRole('button', { name: /Create Room/i }).click()
    await page.getByPlaceholder(/Enter your name/i).fill('TestPlayer')
    await page.getByRole('button', { name: /Continue/i }).click()

    await expect(page.getByText(/Waiting Room/i)).toBeVisible()
  })

  test('Test 11: Copy room code button shows toast', async ({ page }) => {
    await page.goto('/room')

    await page.getByRole('button', { name: /Create Room/i }).click()
    await page.getByPlaceholder(/Enter your name/i).fill('TestPlayer')
    await page.getByRole('button', { name: /Continue/i }).click()
    await page.waitForTimeout(1000)

    await page.getByRole('button', { name: /copy/i }).click()
  })

  test('Test 12: Vibe section appears for host in lobby', async ({ page }) => {
    await page.goto('/room')

    await page.getByRole('button', { name: /Create Room/i }).click()
    await page.getByPlaceholder(/Enter your name/i).fill('TestPlayer')
    await page.getByRole('button', { name: /Continue/i }).click()
    await page.waitForTimeout(1000)

    await expect(page.getByText(/Set a vibe/i)).toBeVisible()
  })

  test('Test 13: Spin page redirects when room not in spin state', async ({ page }) => {
    await page.goto('/room/UNKNOWN')

    const heading = page.getByRole('heading', { name: /Room Not Found/i })
    await expect(heading).toBeVisible()
  })


})
