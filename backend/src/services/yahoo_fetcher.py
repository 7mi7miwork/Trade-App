import asyncio
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import polars as pl
import yfinance as yf
from loguru import logger

from src.services.fetcher import StockDataFetcher

# Cache configuration
CACHE_DIR = Path(__file__).parent.parent / "cache" / "yahoo"
CACHE_TTL_HOURS = 4


class YahooFinanceFetcher(StockDataFetcher):
    """Fetch Taiwan stock data from Yahoo Finance."""

    def __init__(self):
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, code: str) -> Path:
        return CACHE_DIR / f"{code}.parquet"

    def _is_cache_valid(self, cache_path: Path) -> bool:
        """Check if cache file exists and is less than 4 hours old."""
        if not cache_path.exists():
            return False
        mtime = datetime.fromtimestamp(cache_path.stat().st_mtime)
        return (datetime.now() - mtime) < timedelta(hours=CACHE_TTL_HOURS)

    def _save_cache(self, df: pl.DataFrame, code: str):
        """Save DataFrame to parquet cache."""
        cache_path = self._get_cache_path(code)
        df.write_parquet(cache_path)
        logger.info(f"Cached data for {code} to {cache_path}")

    def _load_cache(self, code: str) -> pl.DataFrame:
        """Load DataFrame from parquet cache."""
        cache_path = self._get_cache_path(code)
        return pl.read_parquet(cache_path)

    async def fetch(self, code: str, days: int) -> pl.DataFrame:
        """
        Fetch historical OHLCV data from Yahoo Finance.

        Args:
            code: Taiwan stock code (e.g., "2330")
            days: Number of trading days to fetch

        Returns:
            Polars DataFrame with columns: date, open, high, low, close, volume
        """
        cache_path = self._get_cache_path(code)

        # Check cache first (run sync check in executor)
        loop = asyncio.get_event_loop()
        is_valid = await loop.run_in_executor(
            None, self._is_cache_valid, cache_path
        )

        if is_valid:
            logger.info(f"Using cached data for {code}")
            return self._load_cache(code)

        # Fetch from Yahoo Finance
        symbol = f"{code}.TW"
        logger.info(f"Fetching {symbol} from Yahoo Finance...")

        try:
            # Calculate date range (use extra days to account for trading days)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days * 2)  # Buffer for non-trading days

            df = await loop.run_in_executor(
                None,
                lambda: yf.download(symbol, start=start_date, end=end_date, progress=False, auto_adjust=False),
            )

            if df is None or len(df) == 0:
                raise ValueError(f"No data returned for {symbol}")

            # Reset index to get date as column
            df_reset = df.reset_index()

            # Handle multi-level column names from yfinance
            if isinstance(df_reset.columns, (list, tuple)) and len(df_reset.columns) > 0:
                # Flatten multi-level columns
                if isinstance(df_reset.iloc[0:1].columns, type(df_reset.columns)):
                    col_names = []
                    for col in df_reset.columns:
                        if isinstance(col, tuple):
                            col_names.append(col[0] if col[0] else col[1])
                        else:
                            col_names.append(str(col))
                    df_reset.columns = col_names

            # Select and rename columns for Polars
            cols_to_keep = ["Date", "Open", "High", "Low", "Close", "Volume"]
            available_cols = [c for c in cols_to_keep if c in df_reset.columns]

            if not available_cols:
                raise ValueError(f"No OHLCV columns found for {symbol}")

            df_filtered = df_reset[available_cols]

            # Convert to Polars with proper types
            pl_df = pl.from_pandas(df_filtered)
            pl_df = pl_df.rename(
                {
                    "Date": "date",
                    "Open": "open",
                    "High": "high",
                    "Low": "low",
                    "Close": "close",
                    "Volume": "volume",
                }
            )

            # Ensure correct types
            pl_df = pl_df.with_columns(
                [
                    pl.col("date").cast(pl.Datetime).dt.date(),
                    pl.col("open").cast(pl.Float64),
                    pl.col("high").cast(pl.Float64),
                    pl.col("low").cast(pl.Float64),
                    pl.col("close").cast(pl.Float64),
                    pl.col("volume").cast(pl.Float64),
                ]
            )

            # Sort by date and take the most recent trading days
            pl_df = pl_df.sort("date", descending=False).tail(days)

            # Cache the result
            await loop.run_in_executor(None, self._save_cache, pl_df, code)

            return pl_df

        except Exception as e:
            logger.error(f"Error fetching {symbol} from Yahoo Finance: {e}")
            raise

    def get_stock_name(self, code: str) -> Optional[str]:
        """
        Get stock name from Yahoo Finance ticker info.
        Note: This is a best-effort attempt and may return None.
        """
        try:
            symbol = f"{code}.TW"
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return info.get("shortName") or info.get("longName")
        except Exception as e:
            logger.warning(f"Could not fetch stock name for {code}: {e}")
            return None