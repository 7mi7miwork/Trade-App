import { AiAnalysisRequest, AiAnalysisResult, parseAiResponse } from './types'
import { buildAnalysisPrompt } from '../../utils/buildPrompt'

export async function analyzeWithClaude(
  req: AiAnalysisRequest,
  apiKey: string
): Promise<AiAnalysisResult> {
  const startTime = Date.now()
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildAnalysisPrompt(req) }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Claude API error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''
  return parseAiResponse(text, 'claude', startTime)
}