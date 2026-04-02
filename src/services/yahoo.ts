export interface OHLCVRow {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function daysToRange(days: number): string {
  if (days <= 30) return '1mo'
  if (days <= 90) return '3mo'
  if (days <= 180) return '6mo'
  return '1y'
}

export async function fetchYahooOHLCV(
  code: string,
  periodDays: number
): Promise<OHLCVRow[]> {
  const symbol = code.includes('.TW') ? code : `${code}.TW`
  const range = daysToRange(periodDays)
  const cacheKey = `yahoo_${symbol}_${range}`

  // Try sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      return JSON.parse(cached) as OHLCVRow[]
    }
  } catch {
    // Ignore cache errors, proceed to fetch
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Symbol nicht gefunden: ${code}`)
  }

  const json = await response.json()

  const result = json.chart?.result
  if (!result || result.length === 0) {
    throw new Error(`Symbol nicht gefunden: ${code}`)
  }

  const data = result[0]
  const timestamps = data.timestamp
  const quote = data.indicators?.quote?.[0]

  if (!timestamps || !quote || !quote.close) {
    throw new Error(`Keine Daten verfügbar für: ${code}`)
  }

  const rows: OHLCVRow[] = []

  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close[i]
    const open = quote.open?.[i]
    const high = quote.high?.[i]
    const low = quote.low?.[i]
    const volume = quote.volume?.[i]

    // Skip rows with NaN or null values for essential fields
    if (
      close == null || isNaN(close) ||
      open == null || isNaN(open) ||
      high == null || isNaN(high) ||
      low == null || isNaN(low)
    ) {
      continue
    }

    rows.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: volume != null && !isNaN(volume) ? Math.round(volume) : 0,
    })
  }

  // Cache results in sessionStorage
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(rows))
  } catch {
    // Ignore cache errors
  }

  return rows
}