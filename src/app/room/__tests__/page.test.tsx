import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const genreResponse = () => ({
  ok: true,
  json: async () => [{ id: 18, name: 'Drama' }],
})

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  sessionStorage.setItem('cinematch_user_id', 'fixture-user')
  mocks.createRoom.mockResolvedValue({ id: 'ABCD' })
  mocks.getRoom.mockResolvedValue({ id: 'ABCD' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(genreResponse()))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Room hub', () => {
  it('renders genres from the existing bare-array API contract', async () => {
    render(<RoomPage />)

    expect(await screen.findByRole('button', { name: 'Drama' })).toBeTruthy()
  })

  it('resumes create once with the selected genre and a trimmed name', async () => {
    render(<RoomPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Drama' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }))
    expect(mocks.createRoom).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: '  Asha  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(mocks.createRoom).toHaveBeenCalledTimes(1))
    expect(mocks.createRoom).toHaveBeenCalledWith('fixture-user', 18)
    expect(sessionStorage.getItem('cinematch_user_name')).toBe('Asha')
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
      target: { value: ' Ravi ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(mocks.getRoom).toHaveBeenCalledExactlyOnceWith('ABCD'))
    expect(sessionStorage.getItem('cinematch_user_name')).toBe('Ravi')
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/room/ABCD'))
  })

  it('does not create or join when name collection is cancelled', async () => {
    render(<RoomPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Close name prompt' }))

    fireEvent.change(screen.getByPlaceholderText('ABCD'), { target: { value: 'wxyz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Close name prompt' }))

    await waitFor(() => expect(screen.queryByPlaceholderText('Enter your name')).toBeNull())
    expect(mocks.createRoom).not.toHaveBeenCalled()
    expect(mocks.getRoom).not.toHaveBeenCalled()
  })

  it('reports genre loading failures while keeping Any Genre available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => null }))
    render(<RoomPage />)

    expect((await screen.findByRole('status')).textContent).toContain(
      'Genre filters could not be loaded. You can continue with Any Genre.',
    )
    expect(screen.getByRole('button', { name: 'Any Genre' })).toBeTruthy()
  })

  it('reports an invalid genre payload instead of silently accepting it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ genres: [] }) }))
    render(<RoomPage />)

    expect((await screen.findByRole('status')).textContent).toContain(
      'Genre filters could not be loaded. You can continue with Any Genre.',
    )
  })

  it('aborts a pending genre request when the page unmounts', () => {
    let requestSignal: AbortSignal | undefined
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal as AbortSignal | undefined
      return new Promise<Response>(() => {})
    }))

    const view = render(<RoomPage />)
    view.unmount()

    expect(requestSignal?.aborted).toBe(true)
  })

  it('prevents duplicate create requests while the first request is in flight', async () => {
    sessionStorage.setItem('cinematch_user_name', 'Asha')
    let resolveCreate!: (value: { id: string }) => void
    mocks.createRoom.mockReturnValue(new Promise((resolve) => {
      resolveCreate = resolve
    }))
    render(<RoomPage />)

    const createButton = screen.getByRole('button', { name: 'Create Room' })
    await act(async () => {
      fireEvent.click(createButton)
      fireEvent.click(createButton)
    })

    expect(mocks.createRoom).toHaveBeenCalledTimes(1)
    await act(async () => resolveCreate({ id: 'ABCD' }))
  })

  it('keeps invalid room and provider errors visible', async () => {
    sessionStorage.setItem('cinematch_user_name', 'Asha')
    mocks.getRoom.mockResolvedValue(null)
    render(<RoomPage />)

    fireEvent.change(screen.getByPlaceholderText('ABCD'), { target: { value: 'wxyz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }))
    expect(await screen.findByText('Room not found. Check the code and try again.')).toBeTruthy()

    mocks.createRoom.mockRejectedValue(new Error('Room provider unavailable'))
    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }))
    expect(await screen.findByText('Room provider unavailable')).toBeTruthy()
  })
})
