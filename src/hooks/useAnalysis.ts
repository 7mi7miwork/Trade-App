import { useState, useCallback } from 'react'
import { StockResult, AnalysisState, IndicatorKey, ResultRow, OHLCVRow } from '../types'
import { fetchYahooOHLCV, OHLCVRow as YahooOHLCV } from '../services/yahoo'
import { calcNATR, calcRSI, calcMACD, calcBBands } from '../services/indicators'

const initialState: AnalysisState = {
  results: [],
  isLoading: false,
  error: null,
  progress: null,
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(initialState)

  const buildResultRows = useCallback(
    (rows: YahooOHLCV[], indicators: Set<IndicatorKey>): ResultRow[] => {
      if (rows.length === 0) return []

      const close = rows.map((r) => r.close)
      const high = rows.map((r) => r.high)
      const low = rows.map((r) => r.low)

      // Calculate all requested indicators
      const natrValues = indicators.has('NATR') ? calcNATR(high, low, close) : new Array(rows.length).fill(null)
      const rsiValues = indicators.has('RSI') ? calcRSI(close) : new Array(rows.length).fill(null)
      const macdResult = indicators.has('MACD')
        ? calcMACD(close)
        : { macd: new Array(rows.length).fill(null), signal: new Array(rows.length).fill(null), hist: new Array(rows.length).fill(null) }
      const bbands = indicators.has('BBANDS')
        ? calcBBands(close)
        : { upper: new Array(rows.length).fill(null), middle: new Array(rows.length).fill(null), lower: new Array(rows.length).fill(null) }

      return rows.map((row, i) => ({
        date: row.date,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
        NATR: natrValues[i],
        RSI: rsiValues[i],
        MACD: macdResult.macd[i],
        MACD_signal: macdResult.signal[i],
        MACD_hist: macdResult.hist[i],
        BB_upper: bbands.upper[i],
        BB_middle: bbands.middle[i],
        BB_lower: bbands.lower[i],
      }))
    },
    []
  )

  const runAnalysis = useCallback(
    async (
      codes: string[],
      periodDays: number,
      indicators: Set<IndicatorKey>
    ) => {
      if (codes.length === 0) {
        setState((prev) => ({ ...prev, error: 'Bitte geben Sie mindestens einen Aktiencode ein.' }))
        return
      }

      setState({
        results: [],
        isLoading: true,
        error: null,
        progress: { done: 0, total: codes.length },
      })

      try {
        const promises = codes.map(async (code) => {
          try {
            const rows = await fetchYahooOHLCV(code, periodDays)
            const resultRows = buildResultRows(rows, indicators)

            // Extract name from Yahoo if available
            const symbol = code.includes('.TW') ? code : `${code}.TW`
            const result: StockResult = {
              code,
              name: symbol,
              rows: resultRows,
              error: null,
            }
            return result
          } catch (err) {
            const error = err instanceof Error ? err.message : `Fehler bei ${code}`
            return {
              code,
              name: null,
              rows: [],
              error,
            } as StockResult
          }
        })

        const results = await Promise.allSettled(promises)

        const resolved: StockResult[] = []
        for (const result of results) {
          if (result.status === 'fulfilled') {
            resolved.push(result.value)
          }
        }

        // Sort: successful results first, then errors
        resolved.sort((a, b) => {
          if (a.error && !b.error) return 1
          if (!a.error && b.error) return -1
          return 0
        })

        setState({
          results: resolved,
          isLoading: false,
          error: null,
          progress: null,
        })
      } catch (err) {
        const globalError = err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten'
        setState({
          results: [],
          isLoading: false,
          error: globalError,
          progress: null,
        })
      }
    },
    [buildResultRows]
  )

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    ...state,
    runAnalysis,
    reset,
  }
}