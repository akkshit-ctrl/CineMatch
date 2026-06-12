import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('renders a spinning loader', () => {
    render(<LoadingSpinner />)
    const icon = screen.getByTestId('loader-icon')
    expect(icon).toBeTruthy()
    expect(icon.classList.contains('animate-spin')).toBe(true)
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="text-red-500" />)
    const icon = screen.getByTestId('loader-icon')
    expect(icon.classList.contains('text-red-500')).toBe(true)
  })

  it('uses min-h-screen when fullScreen is true', () => {
    const { container } = render(<LoadingSpinner fullScreen />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.classList.contains('min-h-screen')).toBe(true)
  })

  it('uses py-16 when fullScreen is false', () => {
    const { container } = render(<LoadingSpinner />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.classList.contains('py-16')).toBe(true)
  })
})
