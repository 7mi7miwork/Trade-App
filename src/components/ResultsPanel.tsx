import { StockResult, IndicatorKey } from '../types'
import { StockCard } from './StockCard'

interface ResultsPanelProps {
  results: StockResult[]
  indicators: Set<IndicatorKey>
  anyKeyConfigured: boolean
  onGoToSettings: () => void
}

export function ResultsPanel({ results, indicators, anyKeyConfigured, onGoToSettings }: ResultsPanelProps) {
  if (results.length === 0) return null

  const successCount = results.filter((r) => !r.error).length
  const errorCount = results.filter((r) => r.error).length

  return (
    <div>
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <p className="text-slate-700 font-medium">
          {successCount} 筆成功
          {errorCount > 0 && (
            <span className="text-red-600">，{errorCount} 筆錯誤</span>
          )}
        </p>
      </div>

      {/* Stock Cards */}
      <div className="space-y-4">
        {results.map((result) => (
          <StockCard
            key={result.code}
            result={result}
            indicators={indicators}
            anyKeyConfigured={anyKeyConfigured}
            onGoToSettings={onGoToSettings}
          />
        ))}
      </div>
    </div>
  )
}