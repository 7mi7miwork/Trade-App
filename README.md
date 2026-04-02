# RoyaBot — Taiwan Stock Analysis Web App

**Live URL:** https://7mi7miwork.github.io/Trade-App/

## Description

A free, client-side Taiwan stock analysis tool that runs entirely in the browser. No backend required — deployed as a static site on GitHub Pages.

### Features

- **Excel Upload** — Import stock codes from .xlsx/.xls files via drag-and-drop
- **Manual Input** — Enter stock codes directly (comma, space, or newline separated)
- **Technical Indicators** — Calculate in-browser:
  - **NATR** (Normalized Average True Range) — Volatility indicator
  - **RSI** (Relative Strength Index) — Overbought/Oversold detection
  - **MACD** (Moving Average Convergence Divergence) — Trend-following
  - **Bollinger Bands** — Volatility-based support/resistance bands
- **Interactive Charts** — Powered by Recharts with tooltips and multi-axis views
- **Excel Export** — Download individual stock data or all results as .xlsx

## Local Development

```bash
cd "C:\Users\user\Documents\codes\Trading app"
npm install
npm run dev
```

Open http://localhost:5173/ in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/` directory.

## Deployment

Automatic via GitHub Actions on every push to `main` branch.

### One-time setup (manual):

1. Go to GitHub → Repo → **Settings** → **Pages**
2. **Source:** Select "GitHub Actions" (not "Deploy from a branch")
3. Save

After the first push, the app auto-deploys to:
**https://7mi7miwork.github.io/Trade-App/**

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Excel | SheetJS (xlsx) |
| Data Source | Yahoo Finance (query1.finance.yahoo.com) |
| Deployment | GitHub Actions → GitHub Pages |

## Indicators Explained

### NATR (Normalized Average True Range)
Measures volatility relative to price. Higher values indicate more volatile stocks. Calculated as `(ATR / Close) × 100` where ATR uses Wilder's smoothing over 14 periods.

### RSI (Relative Strength Index)
Momentum oscillator measuring speed and magnitude of price changes. RSI above 70 suggests overbought conditions; below 30 suggests oversold. Uses Wilder's smoothing over 14 periods.

### MACD
Trend-following momentum indicator. MACD Line = EMA(12) − EMA(26). Signal Line = EMA(9) of MACD Line. Histogram = MACD − Signal.

### Bollinger Bands
Volatility bands placed above and below a moving average. Upper = MA + 2σ, Lower = MA − 2σ. Width expands/contracts with volatility.

## Disclaimer

本工具僅供學習與研究目的，不構成投資建議。使用者應自行承擔投資風險。

Data provided by Yahoo Finance. All times shown in Asia/Taipei (UTC+8).