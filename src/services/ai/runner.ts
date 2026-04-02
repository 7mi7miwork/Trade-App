import { AiAnalysisRequest, AiAnalysisResult, AiProvider } from './types'
import { analyzeWithClaude } from './claude'
import { analyzeWithGemini } from './gemini'
import { analyzeWithGrok } from './grok'
import { analyzeWithOpenAI } from './openai'

const PROVIDERS_ORDER: AiProvider[] = ['claude', 'gemini', 'grok', 'openai']

function defaultResult(provider: AiProvider, error: string, durationMs: number): AiAnalysisResult {
  return {
    provider,
    sentiment: 'neutral',
    signal: 'hold',
    confidence: 50,
    summary: '',
    keyPoints: [],
    priceTarget: null,
    risk: 'medium',
    generatedAt: new Date().toISOString(),
    error,
    durationMs,
  }
}

export async function runAllAiAnalyses(
  req: AiAnalysisRequest,
  keys: Partial<Record<AiProvider, string>>
): Promise<AiAnalysisResult[]> {
  const tasks: Promise<AiAnalysisResult>[] = []

  for (const provider of PROVIDERS_ORDER) {
    const apiKey = keys[provider]
    if (!apiKey || apiKey.trim() === '') continue

    const task = (async () => {
      try {
        switch (provider) {
          case 'claude': return await analyzeWithClaude(req, apiKey)
          case 'gemini': return await analyzeWithGemini(req, apiKey)
          case 'grok': return await analyzeWithGrok(req, apiKey)
          case 'openai': return await analyzeWithOpenAI(req, apiKey)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return defaultResult(provider, msg, 0)
      }
    })()

    tasks.push(task)
  }

  const results = await Promise.allSettled(tasks)
  const output: AiAnalysisResult[] = []

  for (const r of results) {
    if (r.status === 'fulfilled') {
      output.push(r.value)
    }
  }

  return output
}