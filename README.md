# RoyaBot Web Edition 📈

A full-stack web application for Taiwan stock market analysis with technical indicators. Originally a Telegram bot, now reimagined as a modern Single-Page Application.

## Features

- **Dual Data Sources**: Yahoo Finance (free, no signup) and Shioaji API (永豐金證券)
- **Technical Indicators**: NATR, RSI, MACD, Bollinger Bands via TA-Lib
- **Interactive Charts**: Price charts with overlay bands, MACD subcharts, RSI with overbought/oversold levels
- **Excel Import/Export**: Upload stock lists via Excel, download results per stock or bulk
- **Parquet Caching**: Automatically caches historical data to avoid redundant API calls
- **Concurrent Processing**: Parallel API calls (max 5) for fast multi-stock analysis
- **No Login Required**: All features available immediately

## Prerequisites

- **Docker** and **Docker Compose** (for containerized deployment)
- **uv** (fast Python package installer & resolver) — install via `pip install uv`
- **Node.js 18+** and **npm** (for local development)
- **TA-Lib C library** (for native TA-Lib binding; falls back to manual calculation)

## Quick Start with Docker

### 1. Clone the repository

```bash
cd "Trading app"
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and optionally add your Shioaji API credentials:

```env
SHIOAJI_API_KEY=your_key_here
SHIOAJI_SECRET_KEY=your_secret_here
```

If left empty, Shioaji will be disabled and only Yahoo Finance will be available.

### 3. Start the application

```bash
docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### 4. Stop the application

```bash
docker compose down
```

> The Parquet cache volume (`royabot-cache`) is preserved across restarts.

## Local Development

### Backend

```bash
cd backend

# Create a virtual environment and install dependencies
uv sync

# Run the development server
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the development server (proxies /api to backend)
npm run dev
```

Frontend will be available at http://localhost:5173 (Vite dev server).

## Technical Indicators

### NATR (Normalized Average True Range)
- **Purpose**: Measures volatility relative to price
- **Formula**: `(ATR / Close) × 100`
- **Period**: 14 days
- **Interpretation**: Higher values = higher volatility. Useful for setting stop-loss levels and comparing volatility across different priced stocks.

### RSI (Relative Strength Index)
- **Purpose**: Momentum oscillator measuring speed and change of price movements
- **Range**: 0–100
- **Period**: 14 days
- **Interpretation**: 
  - RSI > 70: Overbought (potential reversal down)
  - RSI < 30: Oversold (potential reversal up)

### MACD (Moving Average Convergence Divergence)
- **Purpose**: Trend-following momentum indicator
- **Parameters**: (12, 26, 9) — fast EMA, slow EMA, signal line
- **Components**:
  - MACD Line: 12-day EMA minus 26-day EMA
  - Signal Line: 9-day EMA of MACD
  - Histogram: MACD minus Signal
- **Interpretation**: Bullish when MACD crosses above signal; bearish when below.

### Bollinger Bands (BBANDS)
- **Purpose**: Volatility bands around price
- **Period**: 20 days
- **Standard Deviations**: ±2
- **Components**: Upper Band, Middle Band (SMA), Lower Band
- **Interpretation**: Price touching upper band = potentially overbought; touching lower band = potentially oversold. Band width indicates volatility.

## Project Structure

```
Trading app/
├── backend/
│   ├── src/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Pydantic settings
│   │   ├── routers/
│   │   │   ├── analyze.py       # POST /api/analyze
│   │   │   └── health.py        # GET /api/health
│   │   ├── services/
│   │   │   ├── fetcher.py       # Abstract base + DataSourceRouter
│   │   │   ├── yahoo_fetcher.py # Yahoo Finance implementation
│   │   │   ├── shioaji_fetcher.py # Shioaji API implementation
│   │   │   ├── indicators.py    # TA-Lib technical indicators
│   │   │   └── data_pipeline.py # Processing pipeline
│   │   └── cache/               # Parquet cache (gitignored)
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── main.tsx             # React entry point
│   │   ├── index.css            # Tailwind CSS
│   │   ├── api/client.ts        # Axios API client
│   │   ├── types/               # TypeScript interfaces
│   │   └── components/          # React components
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── nginx.conf               # Production Nginx config
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Specification

### `GET /api/health`

Returns server status and configuration info.

```json
{
  "status": "ok",
  "shioaji_enabled": true,
  "timezone": "Asia/Taipei"
}
```

### `POST /api/analyze`

`multipart/form-data` request.

| Field | Type | Required | Description |
|---|---|---|---|
| `stock_codes` | string | one of two | Comma/space/newline separated Taiwan stock codes |
| `file` | file | one of two | Excel file (.xlsx/.xls) with stock codes in first column |
| `data_source` | string | yes | `"shioaji"` or `"yahoo"` |
| `period_days` | integer | no (default 60) | Number of trading days |
| `indicators` | string | yes | JSON array: `["NATR","RSI","MACD","BBANDS"]` |

## Troubleshooting

### TA-Lib installation error

If you see `ta-lib not found`, install the C library first:

- **macOS**: `brew install ta-lib`
- **Linux**: Download from [TA-Lib GitHub](https://github.com/ta-lib/ta-lib/releases) and compile, or use your distro's package manager
- **Docker**: Already included in the Dockerfile

### Shioaji connection failed

- Verify your API key and secret key in `.env`
- Ensure your Shioaji account is active and not expired
- The Shioaji API client connects at startup; check container logs: `docker compose logs backend`

### No data returned for a stock

- Verify the stock code is valid (4-6 digits, e.g., `2330`, `0050`, `2317`)
- Yahoo Finance may use different symbols for some Taiwan stocks
- Try a different data source if available

## Disclaimer

本工具僅供學習與研究目的，不構成投資建議。使用者應自行承擔投資風險。

Data provided by Yahoo Finance and/or Shioaji (永豐金證券). All times shown in Asia/Taipei (UTC+8).

## License

MIT