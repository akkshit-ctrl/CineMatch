import { describe, it, expect } from 'vitest'
import { generateVibePrompt } from '../openai'

describe('generateVibePrompt', () => {
  it('generates a prompt with vibe text', () => {
    const prompt = generateVibePrompt('90s sci-fi thriller')
    expect(prompt).toContain('90s sci-fi thriller')
    expect(prompt).toContain('keywords')
    expect(prompt).toContain('genre_ids')
    expect(prompt).toContain('year_range')
  })

  it('includes genre IDs when provided', () => {
    const prompt = generateVibePrompt('scary movie', [27, 35])
    expect(prompt).toContain('[27, 35]')
    expect(prompt).toContain('User-selected genre IDs')
  })

  it('handles empty vibe', () => {
    const prompt = generateVibePrompt('')
    expect(prompt).toContain('keywords')
  })
})
