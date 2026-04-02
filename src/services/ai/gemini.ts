import { AiAnalysisRequest, AiAnalysisResult, parseAiResponse } from './types'
import { buildAnalysisPrompt } from '../../utils/buildPrompt'

export async function analyzeWithGemini(
  req: AiAnalysisRequest,
  apiKey: string
): Promise<AiAnalysisResult> {
  const startTime = Date.now()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildAnalysisPrompt(req) }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Gemini API error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return parseAiResponse(text, 'gemini', startTime)
}