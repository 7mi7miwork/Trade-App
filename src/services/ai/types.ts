import { ResultRow, IndicatorKey } from '../../types'

export type AiProvider = 'claude' | 'gemini' | 'grok' | 'openai'

export type Sentiment = 'bullish' | 'bearish' | 'neutral'

export type AiSignal = 'buy' | 'hold' | 'sell'

export interface AiAnalysisResult {
  provider: AiProvider
  sentiment: Sentiment
  signal: AiSignal
  confidence: number
  summary: string
  keyPoints: string[]
  priceTarget: string | null
  risk: 'low' | 'medium' | 'high'
  generatedAt: string
  error: string | null
  durationMs: number
}

export interface AiAnalysisRequest {
  stockCode: string
  stockName: string | null
  rows: ResultRow[]
  selectedIndicators: IndicatorKey[]
  lang: 'en' | 'zh-TW'
}

export function parseAiResponse(
  rawText: string,
  provider: AiProvider,
  startTime: number
): AiAnalysisResult {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')

  let parsed: any
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Failed to parse JSON from response')
  }

  return {
    provider,
    sentiment: ['bullish', 'bearish', 'neutral'].includes(parsed.sentiment)
      ? parsed.sentiment
      : 'neutral',
    signal: ['buy', 'hold', 'sell'].includes(parsed.signal)
      ? parsed.signal
      : 'hold',
    confidence: typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
      : 50,
    summary: parsed.summary ?? '',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    priceTarget: typeof parsed.priceTarget === 'string' && parsed.priceTarget ? parsed.priceTarget : null,
    risk: ['low', 'medium', 'high'].includes(parsed.risk) ? parsed.risk : 'medium',
    generatedAt: new Date().toISOString(),
    error: null,
    durationMs: Date.now() - startTime,
  }
}