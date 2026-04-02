import { StockResult, IndicatorKey } from '../types'
import { StockCard } from './StockCard'

interface ResultsPanelProps {
  results: StockResult[]
  indicators: Set<IndicatorKey>
}

export function ResultsPanel({ results, indicators }: ResultsPanelProps) {
  if (results.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Ergebnisse ({results.length} {results.length === 1 ? 'Aktie' : 'Aktien'})
        </h2>
      </div>
      {results.map((result) => (
        <StockCard key={result.code} result={result} indicators={indicators} />
      ))}
    </div>
  )
}