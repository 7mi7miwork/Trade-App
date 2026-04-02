# RoyaBot — Taiwan Stock Analysis (台股分析)

A Taiwan stock analysis web app powered by Yahoo Finance data and AI insights from Claude, Gemini, Grok, and OpenAI.

**Live Demo:** https://7mi7miwork.github.io/Trade-App/

## Features

- 📊 **Technical Indicators:** NATR, RSI, MACD, Bollinger Bands
- 🤖 **AI Analysis:** Claude, Gemini, Grok, OpenAI — compare results side-by-side
- 🌐 **Bilingual:** EN + 繁體中文
- 📥 **Excel Upload/Download:** Batch stock input and export
- 🚀 **Zero-cost Deployment:** GitHub Pages

## Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173/Trade-App/` (or `/` depending on your vite config).

## API Key Setup

### Option 1: Local Development via `.env`

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Required keys (only the ones you plan to use):

| Provider | Key Variable | Get Key |
|---|---|---|
| Claude | `VITE_ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| Gemini | `VITE_GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| Grok | `VITE_GROK_API_KEY` | https://console.x.ai/ |
| OpenAI | `VITE_OPENAI_API_KEY` | https://platform.openai.com/api-keys |

**💡 Free Start:** Gemini `gemini-1.5-flash` has a **free tier** (15 requests/min, 1M tokens/day) — no credit card required.

### Option 2: GitHub Pages via UI Settings

On the live site, go to Settings (⚙️) and enter your API keys directly in the browser. Keys are stored in `localStorage` and never sent to any server.

## Indicators

| Indicator | Description |
|---|---|
| **NATR** | Normalized Average True Range — volatility relative to price (14-period) |
| **RSI** | Relative Strength Index — overbought (>70) / oversold (<30) signal (14-period) |
| **MACD** | Moving Average Convergence Divergence — MACD line, Signal line, Histogram (12,26,9) |
| **Bollinger Bands** | SMA(20) ± 2×StdDev — mean reversion / volatility bands |

## AI Models

| Provider | Model | Notes |
|---|---|---|
| Claude | `claude-haiku-4-5-20251001` | Fast, cost-effective |
| Gemini | `gemini-1.5-flash` | ✅ Free tier available |
| Grok | `grok-3-mini` | xAI's lightweight model |
| OpenAI | `gpt-4o-mini` | Reliable, versatile |

## Deployment

1. Push to `main` branch
2. GitHub Actions automatically builds and deploys
3. Enable GitHub Pages: Settings → Pages → Source: GitHub Actions

## Project Structure

```
Trading app/
├── src/
│   ├── i18n/          # Language files (en, zh-TW) and context
│   ├── components/    # React UI components
│   ├── services/      # Yahoo Finance, technical indicators, AI providers
│   ├── hooks/         # Custom React hooks (analysis, API keys)
│   ├── utils/         # Prompt builder
│   └── types/         # TypeScript type definitions
├── public/            # Static assets (template.xlsx)
└── .github/workflows/ # GitHub Actions deploy
```

## Disclaimer

本工具僅供學習與研究目的，不構成投資建議。使用者應自行承擔投資風險。
Data provided by Yahoo Finance. AI analysis by Claude, Gemini, Grok, and/or OpenAI.
All times shown in Asia/Taipei (UTC+8).