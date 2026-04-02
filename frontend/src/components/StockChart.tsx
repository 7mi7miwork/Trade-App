import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { StockRow } from '../types';

interface StockChartProps {
  rows: StockRow[];
  indicators: string[];
  code: string;
  name?: string | null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function StockChart({ rows, indicators, code, name }: StockChartProps) {
  const hasMACD = indicators.includes('MACD');
  const hasBBands = indicators.includes('BBANDS');
  const hasRSI = indicators.includes('RSI');

  // Custom tooltip
  const CustomTooltip = React.useCallback((props: any) => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) return null;

    const filteredPayload = payload.filter((p: any) => p.value !== undefined && p.value !== null);
    if (filteredPayload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-lg text-xs space-y-1 max-w-48">
        <div className="font-semibold text-gray-700 mb-1">
          {formatFullDate(payload[0].payload.date)}
        </div>
        {filteredPayload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.stroke || entry.color || '#6b7280' }}
              />
              <span className="text-gray-600">{entry.name}:</span>
            </div>
            <span className="font-mono font-medium text-gray-800">
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm border-b pb-2">
        <span className="font-bold text-gray-800 text-base">{code}</span>
        {name && <span className="text-gray-500">- {name}</span>}
      </div>

      {/* Main price chart */}
      <div className="w-full h-64 bg-white rounded-lg p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <Tooltip content={CustomTooltip} />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Close"
            />
            {hasBBands && (
              <>
                <Line
                  type="monotone"
                  dataKey="BB_upper"
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="BB Upper"
                />
                <Line
                  type="monotone"
                  dataKey="BB_middle"
                  stroke="#22c55e"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name="BB Mid"
                />
                <Line
                  type="monotone"
                  dataKey="BB_lower"
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="BB Lower"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* MACD sub-chart */}
      {hasMACD && (
        <div className="w-full h-36 bg-white rounded-lg p-2">
          <p className="text-xs font-semibold text-gray-500 text-center mb-1">MACD (12,26,9)</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip content={CustomTooltip} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
              <Bar
                dataKey="MACD_hist"
                name="MACD Hist"
                fill="#8884d8"
              />
              <Line
                type="monotone"
                dataKey="MACD"
                stroke="#2563eb"
                strokeWidth={1.5}
                dot={false}
                name="MACD"
              />
              <Line
                type="monotone"
                dataKey="MACD_signal"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                name="MACD Sig"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI sub-chart */}
      {hasRSI && (
        <div className="w-full h-32 bg-white rounded-lg p-2">
          <p className="text-xs font-semibold text-gray-500 text-center mb-1">RSI (14)</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={CustomTooltip} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="RSI"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
                name="RSI"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}