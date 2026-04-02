"""
Data pipeline for processing stocks: fetching, indicator calculation, and response formatting.
"""

import asyncio
from datetime import date
from typing import Any, Dict, List, Optional

from loguru import logger

from src.services.fetcher import DataSourceRouter
from src.services.indicators import add_indicators


def _serialize_row(row: dict) -> dict:
    """
    Serialize a single row for JSON response.
    Convert NaN/Inf to None, format dates.
    """
    import math

    serialized = {}
    for key, value in row.items():
        if isinstance(value, float):
            if math.isnan(value) or math.isinf(value):
                serialized[key] = None
            else:
                serialized[key] = value
        elif isinstance(value, date):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized


async def process_stock(
    code: str,
    data_source: str,
    period_days: int,
    indicators: List[str],
) -> Dict[str, Any]:
    """
    Process a single stock: fetch data, compute indicators, format response.

    Args:
        code: Stock code (e.g., "2330")
        data_source: "yahoo" or "shioaji"
        period_days: Number of trading days to fetch
        indicators: List of indicator names to compute

    Returns:
        Dict with "code", "name", "rows", "error" keys
    """
    try:
        # Get data router
        router = DataSourceRouter(data_source)

        # Fetch stock name
        name = router.get_stock_name(code)

        # Fetch OHLCV data
        df = await router.fetch(code, period_days)

        if df.is_empty():
            return {
                "code": code,
                "name": name,
                "rows": [],
                "error": "Keine Daten verfügbar",
            }

        # Add technical indicators
        if indicators:
            df = add_indicators(df, indicators)

        # Sort by date ascending
        df = df.sort("date", descending=False)

        # Convert to list of dicts
        rows = df.to_dicts()

        # Serialize rows (handle NaN, dates)
        serialized_rows = [_serialize_row(row) for row in rows]

        return {
            "code": code,
            "name": name,
            "rows": serialized_rows,
            "error": None,
        }

    except Exception as e:
        logger.error(f"Error processing {code}: {e}")
        return {
            "code": code,
            "name": None,
            "rows": [],
            "error": str(e),
        }