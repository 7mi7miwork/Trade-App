"""
Technical indicators calculation using TA-Lib and Polars.

Supported indicators:
- NATR: Normalized Average True Range
- RSI: Relative Strength Index
- MACD: Moving Average Convergence Divergence
- BBANDS: Bollinger Bands
"""

from typing import List

import numpy as np
import polars as pl
from loguru import logger

# Try to import talib, fall back to manual calculation if not available
try:
    import talib
    HAS_TALIB = True
except ImportError:
    HAS_TALIB = False
    logger.warning("TA-Lib not installed. Using manual indicator calculations.")


def compute_natr(high: pl.Series, low: pl.Series, close: pl.Series, period: int = 14) -> pl.Series:
    """
    Calculate Normalized Average True Range (NATR).
    NATR = (ATR / Close) * 100
    """
    if HAS_TALIB:
        result = talib.NATR(
            high.to_numpy(),
            low.to_numpy(),
            close.to_numpy(),
            timeperiod=period,
        )
        return pl.Series(result)
    else:
        # Manual calculation
        high_arr = high.to_numpy()
        low_arr = low.to_numpy()
        close_arr = close.to_numpy()

        # True Range
        prev_close = np.roll(close_arr, 1)
        tr1 = high_arr - low_arr
        tr2 = np.abs(high_arr - prev_close)
        tr3 = np.abs(low_arr - prev_close)
        tr = np.maximum(np.maximum(tr1, tr2), tr3)
        tr[0] = np.nan  # First value is undefined

        # ATR (Wilders smoothing)
        atr = np.full_like(tr, np.nan)
        atr[period - 1] = np.nanmean(tr[:period])
        for i in range(period, len(tr)):
            atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period

        # NATR
        natr = (atr / close_arr) * 100
        return pl.Series(natr)


def compute_rsi(close: pl.Series, period: int = 14) -> pl.Series:
    """Calculate Relative Strength Index (RSI)."""
    if HAS_TALIB:
        result = talib.RSI(close.to_numpy(), timeperiod=period)
        return pl.Series(result)
    else:
        # Manual calculation using Wilders smoothing
        close_arr = close.to_numpy()
        delta = np.diff(close_arr, prepend=np.nan)

        gain = np.where(delta > 0, delta, 0.0)
        loss = np.where(delta < 0, -delta, 0.0)

        avg_gain = np.full_like(gain, np.nan)
        avg_loss = np.full_like(loss, np.nan)

        # Initial average
        avg_gain[period] = np.mean(gain[1:period + 1])
        avg_loss[period] = np.mean(loss[1:period + 1])

        # Wilders smoothing
        for i in range(period + 1, len(gain)):
            avg_gain[i] = (avg_gain[i - 1] * (period - 1) + gain[i]) / period
            avg_loss[i] = (avg_loss[i - 1] * (period - 1) + loss[i]) / period

        rs = avg_gain / np.where(avg_loss == 0, 1, avg_loss)
        rsi = 100 - (100 / (1 + rs))
        return pl.Series(rsi)


def compute_macd(
    close: pl.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple[pl.Series, pl.Series, pl.Series]:
    """
    Calculate MACD (Moving Average Convergence Divergence).

    Returns:
        (MACD line, Signal line, Histogram)
    """
    if HAS_TALIB:
        macd, signal_line, hist = talib.MACD(
            close.to_numpy(),
            fastperiod=fast,
            slowperiod=slow,
            signalperiod=signal,
        )
        return pl.Series(macd), pl.Series(signal_line), pl.Series(hist)
    else:
        close_arr = close.to_numpy()

        def ema(data: np.ndarray, period: int) -> np.ndarray:
            result = np.full_like(data, np.nan)
            result[period - 1] = np.mean(data[:period])
            multiplier = 2 / (period + 1)
            for i in range(period, len(data)):
                result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1]
            return result

        ema_fast = ema(close_arr, fast)
        ema_slow = ema(close_arr, slow)
        macd_line = ema_fast - ema_slow

        # Signal line is EMA of MACD
        # Handle NaN values in macd_line
        valid_mask = ~np.isnan(macd_line)
        signal_line = np.full_like(macd_line, np.nan)
        valid_values = macd_line[valid_mask]
        if len(valid_values) >= signal:
            signal_ema = ema(valid_values, signal)
            signal_line[valid_mask] = signal_ema

        histogram = macd_line - signal_line
        return pl.Series(macd_line), pl.Series(signal_line), pl.Series(histogram)


def compute_bbands(
    close: pl.Series, period: int = 20, nbdev_up: float = 2.0, nbdev_dn: float = 2.0
) -> tuple[pl.Series, pl.Series, pl.Series]:
    """
    Calculate Bollinger Bands.

    Returns:
        (Upper band, Middle band, Lower band)
    """
    if HAS_TALIB:
        upper, middle, lower = talib.BBANDS(
            close.to_numpy(),
            timeperiod=period,
            nbdevup=nbdev_up,
            nbdevdn=nbdev_dn,
            matype=0,  # SMA
        )
        return pl.Series(upper), pl.Series(middle), pl.Series(lower)
    else:
        close_arr = close.to_numpy()
        n = len(close_arr)

        middle = np.full(n, np.nan)
        std = np.full(n, np.nan)

        for i in range(period - 1, n):
            window = close_arr[i - period + 1:i + 1]
            middle[i] = np.mean(window)
            std[i] = np.std(window, ddof=0)

        upper = middle + nbdev_up * std
        lower = middle - nbdev_dn * std

        return pl.Series(upper), pl.Series(middle), pl.Series(lower)


# Mapping of indicator names to their calculation functions
INDICATORS = {
    "NATR": {
        "columns": ["NATR"],
        "compute": lambda df: [compute_natr(df["high"], df["low"], df["close"])],
    },
    "RSI": {
        "columns": ["RSI"],
        "compute": lambda df: [compute_rsi(df["close"])],
    },
    "MACD": {
        "columns": ["MACD", "MACD_signal", "MACD_hist"],
        "compute": lambda df: compute_macd(df["close"]),
    },
    "BBANDS": {
        "columns": ["BB_upper", "BB_middle", "BB_lower"],
        "compute": lambda df: compute_bbands(df["close"]),
    },
}


def add_indicators(df: pl.DataFrame, indicators: List[str]) -> pl.DataFrame:
    """
    Add technical indicators to a Polars DataFrame.

    Args:
        df: DataFrame with columns: date, open, high, low, close, volume
        indicators: List of indicator names to compute

    Returns:
        DataFrame with additional indicator columns
    """
    result_df = df.clone()

    for indicator_name in indicators:
        if indicator_name not in INDICATORS:
            logger.warning(f"Unknown indicator: {indicator_name}")
            continue

        indicator = INDICATORS[indicator_name]
        try:
            series_list = indicator["compute"](result_df)
            for col_name, series in zip(indicator["columns"], series_list):
                result_df = result_df.with_columns([
                    pl.Series(col_name, series.to_list(), dtype=pl.Float64)
                ])
        except Exception as e:
            logger.error(f"Error computing {indicator_name}: {e}")
            # Add null columns for failed indicators
            for col_name in indicator["columns"]:
                result_df = result_df.with_columns([
                    pl.lit(None, dtype=pl.Float64).alias(col_name)
                ])

    return result_df