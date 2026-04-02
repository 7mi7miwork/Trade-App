import { AiProvider, AiAnalysisResult } from '../services/ai/types'
import { AiProviderBadge } from './AiProviderBadge'
import { useI18n } from '../i18n/context'

interface AiComparisonTableProps {
  results: Partial<Record<AiProvider, AiAnalysisResult>>
  isLoading: boolean
  loadingProviders: AiProvider[]
  onGoToSettings: () => void
}

const ALL_PROVIDERS: { id: AiProvider; label: string }[] = [
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'grok', label: 'Grok' },
  { id: 'openai', label: 'OpenAI' },
]

const sentimentConfig: Record<string, { bg: string; text: string; labelKey: string }> = {
  bullish: { bg: 'bg-green-50', text: 'text-green-600', labelKey: 'aiSentimentBullish' },
  bearish: { bg: 'bg-red-50', text: 'text-red-600', labelKey: 'aiSentimentBearish' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600', labelKey: 'aiSentimentNeutral' },
}

const signalConfig: Record<string, { bg: string; text: string; labelKey: string }> = {
  buy: { bg: 'bg-green-500', text: 'text-white', labelKey: 'aiSignalBuy' },
  hold: { bg: 'bg-yellow-400', text: 'text-white', labelKey: 'aiSignalHold' },
  sell: { bg: 'bg-red-500', text: 'text-white', labelKey: 'aiSignalSell' },
}

const riskConfig: Record<string, string> = {
  low: 'aiRiskLow',
  medium: 'aiRiskMedium',
  high: 'aiRiskHigh',
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
    </div>
  )
}

function ResultCard({ result, provider }: { result: AiAnalysisResult; provider: AiProvider }) {
  const { t } = useI18n()
  const sentCfg = sentimentConfig[result.sentiment] || sentimentConfig.neutral
  const sigCfg = signalConfig[result.signal] || signalConfig.hold

  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
      <div className={sentCfg.bg}>
        <p className={`font-bold ${sentCfg.text} text-sm`}>
          {(t[sentCfg.labelKey as keyof typeof t] as string) || result.sentiment}
        </p>
        <p className={`text-xs ${sentCfg.text}`}>
          Signal: <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${sigCfg.bg} ${sigCfg.text}`}>
            {(t[sigCfg.labelKey as keyof typeof t] as string) || result.signal}
          </span>
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-xs text-gray-500">{t.aiConfidence}</p>
        <ConfidenceBar value={result.confidence} />
        <p className="text-xs text-gray-600 font-medium">{result.confidence}%</p>
      </div>

      {result.summary && (
        <p className="text-xs text-gray-700 leading-relaxed">{result.summary}</p>
      )}

      {result.keyPoints.length > 0 && (
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          {result.keyPoints.slice(0, 5).map((pt, i) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
      )}

      <div className="space-y-1 pt-1 border-t border-slate-100 text-xs">
        {result.priceTarget && (
          <p className="text-gray-600">
            <span className="font-medium text-gray-500">{t.aiPriceTarget}: </span>
            {result.priceTarget}
          </p>
        )}
        <p className="text-gray-600">
          <span className="font-medium text-gray-500">{t.aiRiskMedium.split(' ')[0]}: </span>
          {(t[riskConfig[result.risk] as keyof typeof t] as string) || result.risk}
        </p>
        <p className="text-gray-400">{(t.aiDuration as (ms: number) => string)(result.durationMs)}</p>
      </div>
    </div>
  )
}

function LoadingCard() {
  const { t } = useI18n()
  return (
    <div className="border border-slate-200 rounded-lg p-3 animate-pulse">
      <div className="h-8 bg-slate-100 rounded mb-2" />
      <div className="h-2 bg-slate-100 rounded mb-2" />
      <div className="h-16 bg-slate-50 rounded" />
      <p className="text-xs text-gray-400 mt-2">{t.aiLoading}</p>
    </div>
  )
}

function ErrorCard({ error }: { error: string }) {
  const { t } = useI18n()
  return (
    <div className="border border-red-200 rounded-lg p-3 bg-red-50">
      <p className="text-xs text-red-600 font-medium">⚠ Error</p>
      <p className="text-xs text-red-500 mt-1">{error}</p>
    </div>
  )
}

export function AiComparisonTable({ results, isLoading, loadingProviders, onGoToSettings }: AiComparisonTableProps) {
  const { t } = useI18n()

  // Compute consensus
  let buyCount = 0, holdCount = 0, sellCount = 0, bullishCount = 0
  const completedResults = Object.values(results).filter((r): r is NonNullable<typeof r> => r != null && !r.error)

  for (const r of completedResults) {
    if (r.signal === 'buy') buyCount++
    else if (r.signal === 'hold') holdCount++
    else if (r.signal === 'sell') sellCount++
    if (r.sentiment === 'bullish') bullishCount++
  }

  const totalSignals = buyCount + holdCount + sellCount
  let majority = 'Neutral'
  if (buyCount > holdCount && buyCount > sellCount) majority = t.aiSentimentBullish as string
  else if (sellCount > buyCount && sellCount > holdCount) majority = t.aiSentimentBearish as string
  else if (totalSignals > 0) majority = t.aiSentimentNeutral as string

  return (
    <div className="space-y-3">
      {/* Provider Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ALL_PROVIDERS.map(({ id }) => {
          const result = results[id]
          const isLoading = loadingProviders.includes(id)

          if (isLoading) return <LoadingCard key={id} />
          if (result?.error) return <ErrorCard key={id} error={result.error} />
          if (result) return <ResultCard key={id} result={result} provider={id} />
          return null
        })}
      </div>

      {/* Consensus */}
      {completedResults.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-sm text-slate-700 font-medium">
            {(t.aiConsensus as (b: number, h: number, s: number, m: string) => string)(buyCount, holdCount, sellCount, majority)}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">{t.aiDisclaimer}</p>
    </div>
  )
}