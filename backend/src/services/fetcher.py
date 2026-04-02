import re
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Optional

import polars as pl
from loguru import logger


# Regex pattern for Taiwan stock codes (4-6 digits, optional trailing letter)
STOCK_CODE_PATTERN = re.compile(r"^\d{4,6}[A-Z]?$")


def validate_stock_code(code: str) -> bool:
    """Validate Taiwan stock code format."""
    return bool(STOCK_CODE_PATTERN.match(code.strip()))


class StockDataFetcher(ABC):
    """Abstract base class for stock data fetchers."""

    @abstractmethod
    async def fetch(self, code: str, days: int) -> pl.DataFrame:
        """
        Fetch historical OHLCV data for a given stock.

        Returns Polars DataFrame with columns:
        date, open, high, low, close, volume
        """
        pass

    @abstractmethod
    def get_stock_name(self, code: str) -> Optional[str]:
        """Get the stock name for a code, if available."""
        pass


class DataSourceRouter:
    """Route data fetching to the appropriate provider."""

    def __init__(self, source: str):
        from src.services.yahoo_fetcher import YahooFinanceFetcher
        from src.services.shioaji_fetcher import ShioajiFetcher

        self.source = source
        if source == "yahoo":
            self.fetcher: StockDataFetcher = YahooFinanceFetcher()
        elif source == "shioaji":
            self.fetcher = ShioajiFetcher()
        else:
            raise ValueError(f"Unsupported data source: {source}")

    async def fetch(self, code: str, days: int) -> pl.DataFrame:
        return await self.fetcher.fetch(code, days)

    def get_stock_name(self, code: str) -> Optional[str]:
        return self.fetcher.get_stock_name(code)