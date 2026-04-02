import { useState } from 'react'
import { StockResult, IndicatorKey, ResultRow } from '../types'
import { StockChart } from './StockChart'
import * as XLSX from 'xlsx'

interface StockCardProps {
  result: StockResult
  indicators: Set<IndicatorKey>
}

type SortColumn = 'date' | 'open' | 'high' | 'low' | 'close' | 'volume'
type SortDirection = 'asc' | 'desc'

const INDICATOR_COLUMNS: { key: keyof ResultRow; label: string }[] = [
  { key: 'NATR', label: 'NATR' },
  { key: 'RSI', label: 'RSI' },
  { key: 'MACD', label: 'MACD' },
  { key: 'MACD_signal', label: 'MACD Signal' },
  { key: 'MACD_hist', label: 'MACD Hist' },
  { key: 'BB_upper', label: 'BB Upper' },
  { key: 'BB_middle', label: 'BB Middle' },
  { key: 'BB_lower', label: 'BB Lower' },
]

export function StockCard({ result, indicators }: StockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAllRows, setShowAllRows] = useState(false)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleDownload = () => {
    const rows = result.rows.map((row) => ({
      Datum: row.date,
      Open: row.open,
      High: row.high,
      Low: row.low,
      Close: row.close,
      Volumen: row.volume,
      ...(indicators.has('NATR') ? { NATR: row.NATR ?? null } : {}),
      ...(indicators.has('RSI') ? { RSI: row.RSI ?? null } : {}),
      ...(indicators.has('MACD')
        ? { MACD: row.MACD ?? null, 'MACD Signal': row.MACD_signal ?? null, 'MACD Hist': row.MACD_hist ?? null }
        : {}),
      ...(indicators.has('BBANDS')
        ? { 'BB Upper': row.BB_upper ?? null, 'BB Middle': row.BB_middle ?? null, 'BB Lower': row.BB_lower ?? null }
        : {}),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, result.code)

    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${result.code}_${today}.xlsx`)
  }

  if (result.error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 font-mono font-bold rounded text-sm">
            {result.code}
          </span>
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Fehler
          </span>
        </div>
        <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-600">⚠️</span>
            <p className="text-amber-800 text-sm">{result.error}</p>
          </div>
        </div>
      </div>
    )
  }

  const displayRows = showAllRows ? result.rows : result.rows.slice(0, 60)

  const sortedRows = [...displayRows].sort((a, b) => {
    let aVal: any = a[sortColumn]
    let bVal: any = b[sortColumn]

    if (aVal === null) return 1
    if (bVal === null) return -1

    if (typeof aVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
  })

  const sortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return ' ↕'
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  const visibleIndicators = INDICATOR_COLUMNS.filter((col) => {
    if (col.key === 'MACD' || col.key === 'MACD_signal' || col.key === 'MACD_hist') {
      return indicators.has('MACD')
    }
    if (col.key === 'BB_upper' || col.key === 'BB_middle' || col.key === 'BB_lower') {
      return indicators.has('BBANDS')
    }
    return indicators.has(col.key as IndicatorKey)
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <span className="px-2 py-1 bg-blue-50 text-blue-700 font-mono font-bold rounded text-sm">
            {result.code}
          </span>
          {result.name && (
            <span className="text-sm text-slate-500">{result.name}</span>
          )}
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
        >
          📥 Excel
        </button>
      </div>

      {/* Charts (when expanded) */}
      {isExpanded && (
        <div className="p-4 border-b border-slate-100">
          <StockChart rows={result.rows} indicators={indicators} />
        </div>
      )}

      {/* Data Table */}
      {isExpanded && result.rows.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">Preistabelle</h4>
            {!showAllRows && result.rows.length > 60 && (
              <button
                onClick={() => setShowAllRows(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Alle {result.rows.length} Zeilen anzeigen
              </button>
            )}
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    className="px-3 py-2 text-left font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('date')}
                  >
                    Datum{sortIcon('date')}
                  </th>
                  <th
                    className="px-3 py-2 text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('open')}
                  >
                    Open{sortIcon('open')}
                  </th>
                  <th
                    className="px-3 py-2 text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('high')}
                  >
                    High{sortIcon('high')}
                  </th>
                  <th
                    className="px-3 py-2 text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('low')}
                  >
                    Low{sortIcon('low')}
                  </th>
                  <th
                    className="px-3 py-2 text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('close')}
                  >
                    Close{sortIcon('close')}
                  </th>
                  <th
                    className="px-3 py-2 text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('volume')}
                  >
                    Volumen{sortIcon('volume')}
                  </th>
                  {visibleIndicators.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 text-right font-semibold text-slate-600"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono">{row.date}</td>
                    <td className="px-3 py-2 text-right">{row.open.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{row.high.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{row.low.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{row.close.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{row.volume.toLocaleString()}</td>
                    {visibleIndicators.map((col) => (
                      <td key={col.key} className="px-3 py-2 text-right text-slate-500">
                        {row[col.key] !== null ? (row[col.key] as number).toFixed(2) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}