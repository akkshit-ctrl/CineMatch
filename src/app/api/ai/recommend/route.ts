import { NextResponse } from 'next/server'
import { getOpenAI, AI_MODEL, generateVibePrompt } from '@/lib/openai'
import { AIRecommendation } from '@/types'

export async function POST(request: Request) {
  try {
    const { vibe, genre_ids } = await request.json()

    if (!vibe || typeof vibe !== 'string') {
      return NextResponse.json(
        { error: 'Vibe description is required' },
        { status: 400 }
      )
    }

    const trimmedVibe = vibe.trim()
    if (trimmedVibe.length > 200) {
      return NextResponse.json(
        { error: 'Vibe description too long (max 200 characters)' },
        { status: 400 }
      )
    }

    const validGenreIds =
      Array.isArray(genre_ids) && genre_ids.every((id: unknown) => typeof id === 'number' && Number.isInteger(id))
        ? genre_ids
        : undefined

    const systemPrompt = generateVibePrompt(trimmedVibe, validGenreIds)

    const completion = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Vibe: "${trimmedVibe}".${validGenreIds && validGenreIds.length > 0 ? ` User-selected genre IDs: [${validGenreIds.join(', ')}]` : ''}` }
      ],
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content received from AI')
    }

    let recommendation: AIRecommendation
    try {
      recommendation = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid response' },
        { status: 502 }
      )
    }

    return NextResponse.json(recommendation)

  } catch (error) {
    console.error('AI Recommend Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
