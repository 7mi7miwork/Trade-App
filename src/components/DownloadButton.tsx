import { StockResult } from '../types'
import * as XLSX from 'xlsx'

interface DownloadButtonProps {
  results: StockResult[]
}

export function DownloadButton({ results }: DownloadButtonProps) {
  const handleDownloadAll = () => {
    const wb = XLSX.utils.book_new()

    for (const result of results) {
      if (result.error || result.rows.length === 0) continue

      const rows = result.rows.map((row) => ({
        Datum: row.date,
        Open: row.open,
        High: row.high,
        Low: row.low,
        Close: row.close,
        Volumen: row.volume,
        NATR: row.NATR,
        RSI: row.RSI,
        MACD: row.MACD,
        'MACD Signal': row.MACD_signal,
        'MACD Hist': row.MACD_hist,
        'BB Upper': row.BB_upper,
        'BB Middle': row.BB_middle,
        'BB Lower': row.BB_lower,
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, result.code)
    }

    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `alle_aktien_${today}.xlsx`)
  }

  return (
    <button
      onClick={handleDownloadAll}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
    >
      📥 Alle als Excel herunterladen
    </button>
  )
}