import OpenAI from 'openai'

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('Missing GOOGLE_API_KEY environment variable')
    _openai = new OpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: apiKey,
    })
  }
  return _openai
}

export const AI_MODEL = 'gemini-2.5-flash'

export function generateVibePrompt(vibe: string, genreIds?: number[]): string {
  const genreHint = genreIds && genreIds.length > 0
    ? `User-selected genre IDs: [${genreIds.join(', ')}]. Include these in genre_ids.`
    : ''
  return `You are a movie expert. Convert user 'vibes' into TMDB discovery parameters.
    Respond with ONLY valid JSON. No markdown, no backticks, no extra text.
    Schema:
    {
      "keywords": string[], // 3-5 keywords relevant to the vibe
      "genre_ids": number[], // Array of TMDB genre IDs
      "year_range": { "min": number, "max": number },
      "sort_by": "popularity.desc" | "vote_average.desc"
    }

    ${genreHint}
    User Vibe: "${vibe}"`
}

export { getOpenAI }
