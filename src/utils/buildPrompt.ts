import { AiAnalysisRequest } from '../services/ai/types'
import { ResultRow, IndicatorKey } from '../types'

function formatDate(d: string): string {
  return d
}

function table(rows: ResultRow[]): string {
  const last10 = rows.slice(-10)
  let s = 'Date       | Open   | High   | Low    | Close  | Volume\n'
  for (const r of last10) {
    s += `${r.date} | ${r.open.toFixed(2)} | ${r.high.toFixed(2)} | ${r.low.toFixed(2)} | ${r.close.toFixed(2)} | ${r.volume}\n`
  }
  return s
}

function indicatorSummary(rows: ResultRow[], indicators: IndicatorKey[]): string {
  if (rows.length === 0) return 'No indicator data available.'
  const latest = rows[rows.length - 1]
  let s = ''

  if (indicators.includes('NATR') && latest.NATR != null) {
    s += `- NATR: ${latest.NATR.toFixed(2)}% (volatility relative to price)\n`
  }

  if (indicators.includes('RSI') && latest.RSI != null) {
    const rsiVal = latest.RSI
    let interp = 'neutral'
    if (rsiVal > 70) interp = 'overbought'
    else if (rsiVal < 30) interp = 'oversold'
    s += `- RSI: ${rsiVal.toFixed(2)} (${interp})\n`
  }

  if (indicators.includes('MACD') && latest.MACD != null) {
    const macdVal = latest.MACD.toFixed(4)
    const sigVal = latest.MACD_signal != null ? latest.MACD_signal.toFixed(4) : 'N/A'
    const histVal = latest.MACD_hist != null ? latest.MACD_hist.toFixed(4) : 'N/A'
    const crossover = latest.MACD_hist != null && latest.MACD_hist > 0 ? 'bullish' : 'bearish'
    s += `- MACD: ${macdVal} | Signal: ${sigVal} | Histogram: ${histVal} (${crossover} crossover status)\n`
  }

  if (indicators.includes('BBANDS') && latest.BB_upper != null && latest.BB_lower != null) {
    const range = latest.BB_upper - latest.BB_lower
    const position = range > 0 ? ((latest.close - latest.BB_lower) / range * 100).toFixed(0) : '50'
    s += `- Bollinger Bands: Upper ${latest.BB_upper.toFixed(2)} | Mid ${latest.BB_middle?.toFixed(2) ?? 'N/A'} | Lower ${latest.BB_lower.toFixed(2)} | Current close at ${position}%\n`
  }

  return s || 'No indicators selected or data unavailable.'
}

function trendSummary(rows: ResultRow[]): string {
  if (rows.length < 2) return '- Insufficient data for trend analysis.\n'
  const latest = rows[rows.length - 1].close
  const prev10 = rows.length >= 11 ? rows[rows.length - 11].close : rows[0].close
  const pct10 = ((latest - prev10) / prev10 * 100).toFixed(2)

  let lines = `- 10-day price change: ${pct10}%\n`

  if (rows.length >= 31) {
    const prev30 = rows[rows.length - 31].close
    const pct30 = ((latest - prev30) / prev30 * 100).toFixed(2)
    lines += `- 30-day price change: ${pct30}%\n`
  }

  // Volume trend
  if (rows.length >= 6) {
    const recent5 = rows.slice(-5).reduce((s, r) => s + r.volume, 0) / 5
    const prev5 = rows.slice(-11, -5).reduce((s, r) => s + r.volume, 0) / 5
    const volTrend = prev5 > 0 ? ((recent5 - prev5) / prev5 * 100) : 0
    let label = 'stable'
    if (volTrend > 10) label = 'increasing'
    else if (volTrend < -10) label = 'decreasing'
    lines += `- Recent volume trend: ${label}\n`
  }

  return lines
}

export function buildAnalysisPrompt(req: AiAnalysisRequest): string {
  const { stockCode, stockName, rows, selectedIndicators, lang } = req
  const name = stockName || stockCode
  const startDate = rows.length > 0 ? rows[0].date : 'N/A'
  const endDate = rows.length > 0 ? rows[rows.length - 1].date : 'N/A'
  const targetLang = lang === 'zh-TW' ? 'Traditional Chinese' : 'English'

  return `You are a professional Taiwan stock market analyst. Analyze the following stock data and provide a structured assessment.

Stock: ${stockCode} (${name})
Analysis period: ${startDate} to ${endDate} (${rows.length} trading days)

=== PRICE DATA (last 10 days) ===
${table(rows)}

=== TECHNICAL INDICATORS (latest values) ===
${indicatorSummary(rows, selectedIndicators)}

=== TREND SUMMARY ===
${trendSummary(rows)}

Respond ONLY with a valid JSON object, no markdown, no explanation outside the JSON:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "signal": "buy" | "hold" | "sell",
  "confidence": <integer 0-100>,
  "summary": "<2-4 sentences in ${targetLang}>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "priceTarget": "<range string or null>",
  "risk": "low" | "medium" | "high"
}`
}