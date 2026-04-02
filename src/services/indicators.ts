/**
 * Technical Indicators - Pure TypeScript Implementations
 * All indicators return null for warmup periods
 */

// --- Helper: Exponential Moving Average ---
function calcEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null)
  if (data.length < period) return result

  const k = 2 / (period + 1)

  // First EMA = SMA of first `period` values
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
  }
  result[period - 1] = sum / period

  // Subsequent EMA values
  for (let i = period; i < data.length; i++) {
    result[i] = data[i] * k + (result[i - 1] as number) * (1 - k)
  }

  return result
}

// --- Helper: Simple Moving Average ---
function calcSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null)
  if (data.length < period) return result

  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
  }
  result[period - 1] = sum / period

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period]
    result[i] = sum / period
  }

  return result
}

// --- Helper: Standard Deviation over rolling window ---
function calcRollingStdDev(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null)
  if (data.length < period) return result

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
    result[i] = Math.sqrt(variance)
  }

  return result
}

// === NATR (Normalized Average True Range) ===
export function calcNATR(
  high: number[],
  low: number[],
  close: number[],
  period = 14
): (number | null)[] {
  const n = close.length
  if (n < period + 1) return new Array(n).fill(null)

  // Calculate True Range
  const tr: number[] = new Array(n)
  tr[0] = high[0] - low[0]

  for (let i = 1; i < n; i++) {
    const hl = high[i] - low[i]
    const hc = Math.abs(high[i] - close[i - 1])
    const lc = Math.abs(low[i] - close[i - 1])
    tr[i] = Math.max(hl, hc, lc)
  }

  // Calculate ATR using Wilder's smoothing
  const atr = calcWilderMA(tr, period)

  // NATR = (ATR / close) * 100
  const natr: (number | null)[] = new Array(n).fill(null)
  for (let i = 0; i < n; i++) {
    if (atr[i] !== null && close[i] !== 0) {
      natr[i] = Number((((atr[i] as number) / close[i]) * 100).toFixed(2))
    }
  }

  return natr
}

// --- Helper: Wilder's Moving Average ---
function calcWilderMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null)
  if (data.length < period) return result

  // First ATR = simple average of first `period` TR values
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
  }
  result[period - 1] = sum / period

  // Subsequent ATR values: (prev * (period-1) + current) / period
  for (let i = period; i < data.length; i++) {
    const prev = result[i - 1] as number
    result[i] = (prev * (period - 1) + data[i]) / period
  }

  return result
}

// === RSI (Relative Strength Index) ===
export function calcRSI(close: number[], period = 14): (number | null)[] {
  const n = close.length
  if (n < period + 1) return new Array(n).fill(null)

  // Calculate price changes
  const deltas = new Array<number>(n - 1)
  for (let i = 1; i < n; i++) {
    deltas[i - 1] = close[i] - close[i - 1]
  }

  const gains = deltas.map((d) => Math.max(d, 0))
  const losses = deltas.map((d) => Math.abs(Math.min(d, 0)))

  // Wilder's smoothing for average gain and average loss
  let avgGain = 0
  let avgLoss = 0

  for (let i = 0; i < period; i++) {
    avgGain += gains[i]
    avgLoss += losses[i]
  }
  avgGain /= period
  avgLoss /= period

  const result: (number | null)[] = new Array(n).fill(null)

  // First RSI
  if (avgLoss === 0) {
    result[period] = 100
  } else {
    const rs = avgGain / avgLoss
    result[period] = Number((100 - 100 / (1 + rs)).toFixed(2))
  }

  // Subsequent RSI values with Wilder's smoothing
  for (let i = period; i < deltas.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period

    if (avgLoss === 0) {
      result[i + 1] = 100
    } else {
      const rs = avgGain / avgLoss
      result[i + 1] = Number((100 - 100 / (1 + rs)).toFixed(2))
    }
  }

  return result
}

// === MACD (Moving Average Convergence Divergence) ===
export function calcMACD(
  close: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const n = close.length
  const macdRaw = new Array<number | null>(n).fill(null)

  const fastEMA = calcEMA(close, fastPeriod)
  const slowEMA = calcEMA(close, slowPeriod)

  // MACD Line = Fast EMA - Slow EMA
  // First valid value is at index (slowPeriod - 1) since slowEMA starts there
  for (let i = slowPeriod - 1; i < n; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdRaw[i] = Number(((fastEMA[i] as number) - (slowEMA[i] as number)).toFixed(4))
    }
  }

  // Signal Line = EMA of MACD Line
  // We need to extract non-null MACD values, calculate EMA, then map back
  const macdValues: number[] = []
  const macdIndices: number[] = []
  for (let i = 0; i < n; i++) {
    if (macdRaw[i] !== null) {
      macdValues.push(macdRaw[i] as number)
      macdIndices.push(i)
    }
  }

  const signalEMA = calcEMA(macdValues, signalPeriod)

  const signal: (number | null)[] = new Array(n).fill(null)
  for (let i = 0; i < signalEMA.length; i++) {
    if (signalEMA[i] !== null) {
      signal[macdIndices[i]] = Number((signalEMA[i] as number).toFixed(4))
    }
  }

  // Histogram = MACD - Signal
  const hist: (number | null)[] = new Array(n).fill(null)
  for (let i = 0; i < n; i++) {
    if (macdRaw[i] !== null && signal[i] !== null) {
      hist[i] = Number(((macdRaw[i] as number) - (signal[i] as number)).toFixed(4))
    }
  }

  return { macd: macdRaw, signal, hist }
}

// === Bollinger Bands ===
export function calcBBands(
  close: number[],
  period = 20,
  stdDevMult = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const n = close.length
  const middle = calcSMA(close, period)
  const stdDev = calcRollingStdDev(close, period)

  const upper: (number | null)[] = new Array(n).fill(null)
  const lower: (number | null)[] = new Array(n).fill(null)

  for (let i = 0; i < n; i++) {
    if (middle[i] !== null && stdDev[i] !== null) {
      const m = middle[i] as number
      const s = stdDev[i] as number
      upper[i] = Number((m + stdDevMult * s).toFixed(2))
      lower[i] = Number((m - stdDevMult * s).toFixed(2))
    }
  }

  return { upper, middle, lower }
}