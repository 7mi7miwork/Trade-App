import * as XLSX from 'xlsx'
import { useState, useCallback } from 'react'
import { StockResult, IndicatorKey, ResultRow } from '../types'
import { StockChart } from './StockChart'
import { AiComparisonTable } from './AiComparisonTable'
import { AiProviderBadge } from './AiProviderBadge'
import { AiProvider } from '../services/ai/types'
import { useI18n } from '../i18n/context'
import { useAiAnalysis } from '../hooks/useAiAnalysis'
import { buildAnalysisPrompt } from '../utils/buildPrompt'

interface StockCardProps {
  result: StockResult
  indicators: Set<IndicatorKey>
  anyKeyConfigured: boolean
  onGoToSettings: () => void
}

type SortKey = keyof ResultRow
type SortDir = 'asc' | 'desc'

function formatNumber(val: number | null): string {
  if (val === null) return '—'
  return val.toFixed(2)
}

function formatVolume(val: number): string {
  if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M'
  if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K'
  return val.toString()
}

const CONFIGURED_PROVIDERS: AiProvider[] = ['claude', 'gemini', 'grok', 'openai']

export function StockCard({ result, indicators, anyKeyConfigured, onGoToSettings }: StockCardProps) {
  const { t } = useI18n()
  const { results, isLoading, loadingProviders, runAnalysis } = useAiAnalysis()
  const [isOpen, setIsOpen] = useState(false)
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showRows, setShowRows] = useState(60)

  const { code, rows, error } = result
  const displayName = result.name || code

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return sortDir === 'asc' ? -1 : 1
    if (bVal === null) return sortDir === 'asc' ? 1 : -1
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    const aNum = aVal as number
    const bNum = bVal as number
    return sortDir === 'asc' ? aNum - bNum : bNum - aNum
  })

  const visibleRows = sortedRows.slice(0, showRows)

  const indicatorColumns: { key: SortKey; label: string }[] = []
  if (indicators.has('NATR')) indicatorColumns.push({ key: 'NATR', label: 'NATR' })
  if (indicators.has('RSI')) indicatorColumns.push({ key: 'RSI', label: 'RSI' })
  if (indicators.has('MACD')) {
    indicatorColumns.push({ key: 'MACD', label: 'MACD' })
    indicatorColumns.push({ key: 'MACD_signal', label: 'MACD Signal' })
    indicatorColumns.push({ key: 'MACD_hist', label: 'MACD Hist' })
  }
  if (indicators.has('BBANDS')) {
    indicatorColumns.push({ key: 'BB_upper', label: 'BB Upper' })
    indicatorColumns.push({ key: 'BB_middle', label: 'BB Middle' })
    indicatorColumns.push({ key: 'BB_lower', label: 'BB Lower' })
  }

  const handleDownload = () => {
    if (rows.length === 0) return
    const { utils, write } = XLSX
    const headerRow = [
      '日期', 'Open', 'High', 'Low', 'Close', 'Volume',
      ...indicatorColumns.map((c) => c.label),
    ]
    const dataRows = sortedRows.map((r) => [
      r.date,
      r.open,
      r.high,
      r.low,
      r.close,
      r.volume,
      ...indicatorColumns.map((c) => {
        const val = r[c.key as keyof ResultRow]
        return val === null ? '—' : val
      }),
    ])
    const ws = utils.aoa_to_sheet([headerRow, ...dataRows])
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, code)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const fileName = `${code}_${dateStr}.xlsx`
    const wbout = write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleAiAnalysis = useCallback(() => {
    if (!anyKeyConfigured) return
    runAnalysis({
      stockCode: code,
      stockName: displayName,
      rows,
      selectedIndicators: Array.from(indicators) as IndicatorKey[],
      lang: 'zh-TW',
    })
    setShowAiAnalysis(true)
  }, [runAnalysis, code, displayName, rows, indicators, anyKeyConfigured])

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg text-slate-900">{code}</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              {t.error}
            </span>
          </div>
          <span className="text-slate-400">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div className="px-4 pb-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ {(t.errorLoadingData as (err: string) => string)(error)}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (rows.length === 0) return null

  const latestDate = sortedRows[0]?.date || ''
  const latestClose = sortedRows[0]?.close ?? null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3"
        >
          <span className="font-semibold text-lg text-slate-900">{code}</span>
          {latestClose !== null && (
            <span className="text-slate-500 text-sm">
              {latestClose.toFixed(2)} TWD ({latestDate})
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            📥 {t.download}
          </button>
          <span className="text-slate-400 cursor-pointer">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expandable Content */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Charts */}
          <StockChart rows={rows} indicators={indicators} />

          {/* AI Analysis Section */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">
                🤖 AI {t.aiAnalyseButtonShort}
              </h4>
              <div className="flex items-center gap-2">
                {CONFIGURED_PROVIDERS.map((p) => (
                  <AiProviderBadge key={p} provider={p} size="sm" />
                ))}
              </div>
            </div>

            {anyKeyConfigured ? (
              <button
                onClick={handleAiAnalysis}
                disabled={isLoading}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                }`}
              >
                {isLoading ? t.aiLoading : t.aiAnalyseButton}
              </button>
            ) : (
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500">{t.aiNoKeysConfigured}</p>
                <button
                  onClick={onGoToSettings}
                  className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
                >
                  {t.aiConfigureLink}
                </button>
              </div>
            )}

            {/* AI Comparison Table */}
            {(showAiAnalysis || Object.keys(results).length > 0) && (
              <AiComparisonTable
                results={results}
                isLoading={isLoading}
                loadingProviders={loadingProviders}
                onGoToSettings={onGoToSettings}
              />
            )}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    { key: 'date' as SortKey, label: '日期' },
                    { key: 'open' as SortKey, label: 'Open' },
                    { key: 'high' as SortKey, label: 'High' },
                    { key: 'low' as SortKey, label: 'Low' },
                    { key: 'close' as SortKey, label: 'Close' },
                    { key: 'volume' as SortKey, label: 'Volume' },
                    ...indicatorColumns,
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-3 py-2 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className="ml-1 text-slate-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr
                    key={row.date}
                    className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}
                  >
                    <td className="px-3 py-2 font-medium">{row.date}</td>
                    <td className="px-3 py-2">{formatNumber(row.open)}</td>
                    <td className="px-3 py-2">{formatNumber(row.high)}</td>
                    <td className="px-3 py-2">{formatNumber(row.low)}</td>
                    <td className="px-3 py-2">{formatNumber(row.close)}</td>
                    <td className="px-3 py-2">{formatVolume(row.volume)}</td>
                    {indicatorColumns.map((col) => {
                      const val = row[col.key as keyof ResultRow] as number | null
                      return <td key={col.key} className="px-3 py-2">{formatNumber(val)}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedRows.length > showRows && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => setShowRows((r) => Math.min(r + 60, sortedRows.length))}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {(t.moreRows as (count: number) => string)(sortedRows.length - showRows)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}