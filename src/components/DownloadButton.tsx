import * as XLSX from 'xlsx'
import { StockResult, ResultRow, IndicatorKey } from '../types'

interface DownloadButtonProps {
  results: StockResult[]
}

const ALL_INDICATORS: IndicatorKey[] = ['NATR', 'RSI', 'MACD', 'BBANDS']

function getIndicatorColumns(indicators: Set<IndicatorKey>): { key: string; label: string }[] {
  const cols: { key: string; label: string }[] = []
  if (indicators.has('NATR')) cols.push({ key: 'NATR', label: 'NATR' })
  if (indicators.has('RSI')) cols.push({ key: 'RSI', label: 'RSI' })
  if (indicators.has('MACD')) {
    cols.push({ key: 'MACD', label: 'MACD' })
    cols.push({ key: 'MACD_signal', label: 'MACD Signal' })
    cols.push({ key: 'MACD_hist', label: 'MACD Hist' })
  }
  if (indicators.has('BBANDS')) {
    cols.push({ key: 'BB_upper', label: 'BB Upper' })
    cols.push({ key: 'BB_middle', label: 'BB Middle' })
    cols.push({ key: 'BB_lower', label: 'BB Lower' })
  }
  return cols
}

function buildSheetData(rows: ResultRow[], indicators: Set<IndicatorKey>) {
  const indCols = getIndicatorColumns(indicators)
  const headerRow = ['Datum', 'Open', 'High', 'Low', 'Close', 'Volumen', ...indCols.map((c) => c.label)]

  const dataRows = rows.map((r) => [
    r.date,
    r.open,
    r.high,
    r.low,
    r.close,
    r.volume,
    ...indCols.map((col) => {
      const val = (r as Record<string, any>)[col.key]
      return val === null ? '—' : val
    }),
  ])

  return [headerRow, ...dataRows]
}

export function DownloadButton({ results }: DownloadButtonProps) {
  const successResults = results.filter((r) => !r.error && r.rows.length > 0)
  if (successResults.length === 0) return null

  // Collect all active indicators across all results
  const activeIndicators = new Set<IndicatorKey>()
  ALL_INDICATORS.forEach((ind) => {
    if (successResults.length > 0) activeIndicators.add(ind)
  })

  const handleDownload = () => {
    const wb = XLSX.utils.book_new()

    successResults.forEach((result) => {
      const sheetData = buildSheetData(result.rows, activeIndicators)
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 10 }, // Open
        { wch: 10 }, // High
        { wch: 10 }, // Low
        { wch: 10 }, // Close
        { wch: 12 }, // Volume
        ...getIndicatorColumns(activeIndicators).map(() => ({ wch: 12 })),
      ]

      XLSX.utils.book_append_sheet(wb, ws, result.code)
    })

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const fileName = `analyse_${dateStr}.xlsx`

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
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

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
    >
      📥 Alle als Excel herunterladen
    </button>
  )
}