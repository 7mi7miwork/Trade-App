import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import polars as pl
from loguru import logger

from src.config import get_settings
from src.services.fetcher import StockDataFetcher

# Cache configuration
CACHE_DIR = Path(__file__).parent.parent / "cache" / "shioaji"
CACHE_TTL_HOURS = 4


class ShioajiFetcher(StockDataFetcher):
    """Fetch Taiwan stock data from Shioaji (永豐金證券) API."""

    def __init__(self):
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self._api = None
        self._stock_names: dict = {}
        self._initialize_api()

    def _initialize_api(self):
        """Initialize Shioaji API client."""
        settings = get_settings()
        if not settings.shioaji_enabled:
            raise RuntimeError("Shioaji credentials not configured")

        try:
            import shioaji as sj

            self._api = sj.Shioaji()
            self._api.login(
                api_key=settings.shioaji_api_key,
                secret_key=settings.shioaji_secret_key,
            )
            logger.info("Shioaji API initialized successfully")
        except ImportError:
            raise RuntimeError("shioaji package not installed")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Shioaji API: {e}")

    def _get_contract(self, code: str):
        """Get contract for a stock code."""
        try:
            contract = self._api.Contracts.Stocks[code]
            return contract
        except Exception as e:
            logger.error(f"Could not find contract for {code}: {e}")
            raise

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
        Fetch historical OHLCV data from Shioaji API.

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

        # Fetch from Shioaji
        logger.info(f"Fetching {code} from Shioaji...")

        try:
            # Get contract
            contract = await loop.run_in_executor(None, self._get_contract, code)

            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days * 2)

            # Fetch K-line data
            kbars = await loop.run_in_executor(
                None,
                lambda: self._api.stock.kbars(
                    contract=contract,
                    start=start_date.strftime("%Y-%m-%d"),
                    end=end_date.strftime("%Y-%m-%d"),
                ),
            )

            if not kbars:
                raise ValueError(f"No data returned for {code}")

            # Convert to Polars DataFrame
            data = {
                "date": kbars.ts,
                "open": [float(k.open) for k in kbars.kbar],
                "high": [float(k.high) for k in kbars.kbar],
                "low": [float(k.low) for k in kbars.kbar],
                "close": [float(k.close) for k in kbars.kbar],
                "volume": [int(k.volume) for k in kbars.kbar],
            }

            pl_df = pl.DataFrame(data)

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
            logger.error(f"Error fetching {code} from Shioaji: {e}")
            raise

    def get_stock_name(self, code: str) -> Optional[str]:
        """Get stock name from Shioaji contract."""
        if self._api is None:
            return None

        if code in self._stock_names:
            return self._stock_names[code]

        try:
            contract = self._api.Contracts.Stocks[code]
            name = contract.name
            self._stock_names[code] = name
            return name
        except Exception as e:
            logger.warning(f"Could not fetch stock name for {code}: {e}")
            return None