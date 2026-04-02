import { useState } from 'react'
import { useAnalysis } from './hooks/useAnalysis'
import { StockInput } from './components/StockInput'
import { IndicatorSelector } from './components/IndicatorSelector'
import { ResultsPanel } from './components/ResultsPanel'
import { DownloadButton } from './components/DownloadButton'
import { IndicatorKey } from './types'

function App() {
  const { results, isLoading, error, progress, runAnalysis, reset } = useAnalysis()
  const [periodDays, setPeriodDays] = useState(60)
  const [indicators, setIndicators] = useState<Set<IndicatorKey>>(
    new Set(['NATR', 'RSI', 'MACD', 'BBANDS'])
  )

  const handleAnalyze = (codes: string[]) => {
    runAnalysis(codes, periodDays, indicators)
  }

  const toggleIndicator = (key: IndicatorKey) => {
    setIndicators((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">📈 RoyaBot</h1>
              <p className="text-sm text-slate-500">Taiwan-Aktienanalyse mit technischen Indikatoren</p>
            </div>
            {results.length > 0 && (
              <DownloadButton results={results} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <StockInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Options Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <IndicatorSelector
            periodDays={periodDays}
            onPeriodChange={setPeriodDays}
            indicators={indicators}
            onToggleIndicator={toggleIndicator}
          />
        </div>

        {/* Global Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-lg">⚠️</span>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-blue-700 font-medium">
              Analysiere {progress.done}/{progress.total} Aktien...
            </p>
            <div className="mt-3 bg-blue-200 rounded-full h-2 max-w-sm mx-auto">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        <ResultsPanel results={results} indicators={indicators} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">
            本工具僅供學習與研究目的，不構成投資建議。使用者應自行承擔投資風險。
            Data provided by Yahoo Finance.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App