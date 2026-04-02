import { AiAnalysisRequest, AiAnalysisResult, parseAiResponse } from './types'
import { buildAnalysisPrompt } from '../../utils/buildPrompt'

export async function analyzeWithGrok(
  req: AiAnalysisRequest,
  apiKey: string
): Promise<AiAnalysisResult> {
  const startTime = Date.now()
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{ role: 'user', content: buildAnalysisPrompt(req) }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Grok API error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  return parseAiResponse(text, 'grok', startTime)
}