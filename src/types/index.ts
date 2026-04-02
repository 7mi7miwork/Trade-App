export type IndicatorKey = 'NATR' | 'RSI' | 'MACD' | 'BBANDS'

export interface OHLCVRow {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ResultRow extends OHLCVRow {
  NATR: number | null
  RSI: number | null
  MACD: number | null
  MACD_signal: number | null
  MACD_hist: number | null
  BB_upper: number | null
  BB_middle: number | null
  BB_lower: number | null
}

export interface StockResult {
  code: string
  name: string | null
  rows: ResultRow[]
  error: string | null
}

export interface AnalysisState {
  results: StockResult[]
  isLoading: boolean
  error: string | null
  progress: { done: number; total: number } | null
}