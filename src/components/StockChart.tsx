import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts'
import { ResultRow, IndicatorKey } from '../types'

interface StockChartProps {
  rows: ResultRow[]
  indicators: Set<IndicatorKey>
}

function formatNumber(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(2)
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs rounded-lg p-2 shadow-lg">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function StockChart({ rows, indicators }: StockChartProps) {
  const data = rows.map((row) => ({
    date: row.date,
    close: row.close,
    BB_upper: row.BB_upper,
    BB_middle: row.BB_middle,
    BB_lower: row.BB_lower,
    MACD: row.MACD,
    MACD_signal: row.MACD_signal,
    MACD_hist: row.MACD_hist,
    RSI: row.RSI,
  }))

  const hasBB = indicators.has('BBANDS')
  const hasMACD = indicators.has('MACD')
  const hasRSI = indicators.has('RSI')

  return (
    <div className="space-y-4">
      {/* Main Price Chart */}
      <div className="bg-slate-50 rounded-lg p-3">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(value: string) => value.slice(5)}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10 }}
              tickFormatter={(value: number) => value.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="line" />
            {hasBB && (
              <>
                <Line
                  type="monotone"
                  name="BB Upper"
                  dataKey="BB_upper"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  name="BB Middle"
                  dataKey="BB_middle"
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  name="BB Lower"
                  dataKey="BB_lower"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={1}
                />
              </>
            )}
            <Line
              type="monotone"
              name="Close"
              dataKey="close"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MACD Sub-Chart */}
      {hasMACD && (
        <div className="bg-slate-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">MACD</h4>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                name="MACD Hist"
                dataKey="MACD_hist"
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
              >
                {data.map((entry, index) => (
                  <rect
                    key={index}
                    fill={(entry.MACD_hist ?? 0) >= 0 ? '#22c55e' : '#ef4444'}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                name="MACD"
                dataKey="MACD"
                stroke="#f59e0b"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                name="Signal"
                dataKey="MACD_signal"
                stroke="#8b5cf6"
                dot={false}
                strokeWidth={1}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI Sub-Chart */}
      {hasRSI && (
        <div className="bg-slate-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">RSI</h4>
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                name="30-70 Zone"
                dataKey={() => 50}
                fill="none"
                stroke="none"
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
              <Area
                type="monotone"
                name="RSI"
                dataKey="RSI"
                fill="#dbeafe"
                stroke="#3b82f6"
                strokeWidth={1.5}
                connectNulls
              />
              {/* Shade area between 30 and 70 */}
              <rect
                x={0}
                y={30}
                width="100%"
                height={40}
                fill="#f1f5f9"
                opacity={0.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}