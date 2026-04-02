import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts'
import { ResultRow, IndicatorKey } from '../types'

interface StockChartProps {
  rows: ResultRow[]
  indicators: Set<IndicatorKey>
}

const COLORS = {
  close: '#3b82f6',
  upper: '#94a3b8',
  middle: '#22c55e',
  lower: '#94a3b8',
  macd: '#3b82f6',
  signal: '#f59e0b',
  histPos: '#22c55e',
  histNeg: '#ef4444',
}

function formatTooltipNum(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return '—'
  return val.toFixed(2)
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-slate-200 rounded-lg shadow-lg p-3 text-xs space-y-1">
        <p className="font-bold text-slate-800">{label}</p>
        {payload.map((entry: any, i: number) => {
          const name = entry.name || entry.dataKey
          const value = formatTooltipNum(entry.value)
          return (
            <p key={i} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-0.5 rounded"
                style={{ backgroundColor: entry.stroke || entry.fill || '#999' }}
              />
              <span className="text-slate-600">{name}:</span>
              <span className="font-mono font-bold">{value}</span>
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

export function StockChart({ rows, indicators }: StockChartProps) {
  const hasBB = indicators.has('BBANDS')
  const hasMACD = indicators.has('MACD')
  const hasRSI = indicators.has('RSI')

  // Price Chart Data
  const priceData = rows.map((r) => ({
    date: r.date,
    close: r.close,
    BB_upper: hasBB ? r.BB_upper : undefined,
    BB_middle: hasBB ? r.BB_middle : undefined,
    BB_lower: hasBB ? r.BB_lower : undefined,
  }))

  return (
    <div className="space-y-6">
      {/* Price + Bollinger Bands Chart */}
      <div className="h-64">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Preis & Bollinger Bands</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(val: string) => val.slice(5)}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11 }}
              tickFormatter={(val: number) => val.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="close"
              name="Close"
              stroke={COLORS.close}
              strokeWidth={1.5}
              dot={false}
              animationDuration={500}
            />
            {hasBB && (
              <>
                <Line
                  type="monotone"
                  dataKey="BB_upper"
                  name="BB Upper"
                  stroke={COLORS.upper}
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="BB_middle"
                  name="BB Middle"
                  stroke={COLORS.middle}
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="BB_lower"
                  name="BB Lower"
                  stroke={COLORS.lower}
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  dot={false}
                  connectNulls={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MACD Subchart */}
      {hasMACD && (
        <div className="h-48">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">MACD</h4>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rows.map((r) => ({
                date: r.date,
                MACD: r.MACD,
                MACD_signal: r.MACD_signal,
                MACD_hist: r.MACD_hist,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(val: string) => val.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val: number) => val.toFixed(2)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="MACD_hist"
                name="MACD Histogram"
                fill={COLORS.histPos}
                stroke="none"
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="MACD"
                name="MACD"
                stroke={COLORS.macd}
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="MACD_signal"
                name="MACD Signal"
                stroke={COLORS.signal}
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI Subchart */}
      {hasRSI && (
        <div className="h-40">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">RSI</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows.map((r) => ({
                date: r.date,
                RSI: r.RSI,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(val: string) => val.slice(5)}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 3" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 3" />
              <Area
                type="monotone"
                dataKey="RSI"
                fill="#e5e7eb"
                opacity={0.3}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="RSI"
                name="RSI"
                stroke="#7c3aed"
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}