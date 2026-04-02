import { IndicatorKey } from '../types'

interface IndicatorSelectorProps {
  periodDays: number
  onPeriodChange: (days: number) => void
  indicators: Set<IndicatorKey>
  onToggleIndicator: (key: IndicatorKey) => void
}

const indicators: { key: IndicatorKey; label: string; description: string }[] = [
  { key: 'NATR', label: 'NATR', description: 'Normalized Average True Range — Volatilitätsindikator' },
  { key: 'RSI', label: 'RSI', description: 'Relative Strength Index — Überkauft/Überverkauft' },
  { key: 'MACD', label: 'MACD', description: 'Moving Average Convergence Divergence — Trendfolge' },
  { key: 'BBANDS', label: 'Bollinger Bands', description: 'Volatilitätsbasierte Unterstützungs-/Widerstandsbänder' },
]

const periodOptions = [
  { value: 30, label: '30 Tage' },
  { value: 60, label: '60 Tage' },
  { value: 90, label: '90 Tage' },
  { value: 180, label: '180 Tage' },
]

export function IndicatorSelector({
  periodDays,
  onPeriodChange,
  indicators: activeIndicators,
  onToggleIndicator,
}: IndicatorSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Period Selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          📅 Zeitraum
        </label>
        <select
          value={periodDays}
          onChange={(e) => onPeriodChange(Number(e.target.value))}
          className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Indicator Checkboxes */}
      <div className="flex-1">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          📊 Technische Indikatoren
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {indicators.map(({ key, label, description }) => (
            <label
              key={key}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                activeIndicators.size === 1 && activeIndicators.has(key)
                  ? 'border-amber-300 bg-amber-50 cursor-not-allowed'
                  : activeIndicators.has(key)
                  ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={activeIndicators.has(key)}
                onChange={() => onToggleIndicator(key)}
                disabled={activeIndicators.size === 1 && activeIndicators.has(key)}
                className="mt-0.5 w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-slate-900">{label}</span>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}