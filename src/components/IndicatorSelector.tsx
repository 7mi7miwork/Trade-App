import { IndicatorKey } from '../types'

interface IndicatorSelectorProps {
  periodDays: number
  periodOptions: number[]
  onPeriodChange: (days: number) => void
  indicators: Set<IndicatorKey>
  onToggleIndicator: (key: IndicatorKey) => void
}

const INDICATOR_LABELS: Record<IndicatorKey, string> = {
  NATR: 'NATR (Normalized Average True Range)',
  RSI: 'RSI (Relative Strength Index)',
  MACD: 'MACD (Moving Average Convergence Divergence)',
  BBANDS: 'Bollinger Bands',
}

export function IndicatorSelector({
  periodDays,
  periodOptions,
  onPeriodChange,
  indicators,
  onToggleIndicator,
}: IndicatorSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Einstellungen</h3>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Period Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Zeitraum (Tage)
          </label>
          <select
            value={periodDays}
            onChange={(e) => onPeriodChange(Number(e.target.value))}
            className="w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periodOptions.map((days) => (
              <option key={days} value={days}>
                {days} Tage
              </option>
            ))}
          </select>
        </div>

        {/* Indicator Checkboxes */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Indikatoren
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(INDICATOR_LABELS) as IndicatorKey[]).map((key) => (
              <label
                key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  indicators.has(key)
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={indicators.has(key)}
                  onChange={() => onToggleIndicator(key)}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{INDICATOR_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}