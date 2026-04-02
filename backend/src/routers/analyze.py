import asyncio
import io
import json
import re
import time
from asyncio import Semaphore
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import List, Optional

import polars as pl
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from src.config import get_settings
from src.services.data_pipeline import process_stock
from src.services.fetcher import validate_stock_code

router = APIRouter()

# Thread pool for CPU-bound Polars operations
_executor = ThreadPoolExecutor(max_workers=4)

# Semaphor for concurrent API calls (max 5)
_semaphore = asyncio.Semaphore(5)


class AnalyzeResponse:
    """Response model for the analyze endpoint."""

    def __init__(self, results, source_used, elapsed_seconds):
        self.results = results
        self.source_used = source_used
        self.elapsed_seconds = elapsed_seconds

    def dict(self):
        return {
            "results": self.results,
            "source_used": self.source_used,
            "elapsed_seconds": round(self.elapsed_seconds, 2),
        }


def parse_stock_codes(codes_str: str) -> list:
    """Parse stock codes from comma, space, or newline separated string."""
    if not codes_str:
        return []
    # Split by comma, space, or newline
    raw_codes = re.split(r"[,\s\n]+", codes_str.strip())
    # Clean and deduplicate
    codes = []
    seen = set()
    for code in raw_codes:
        cleaned = code.strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            codes.append(cleaned)
    return codes


async def parse_excel_codes(file: UploadFile) -> list:
    """Parse stock codes from uploaded Excel file."""
    content = await file.read()
    try:
        # Use Polars to read Excel
        df = pl.read_excel(source=io.BytesIO(content))
        # Get first column, skip header, clean whitespace
        first_col = df.columns[0]
        codes = df[first_col].to_list()
        # Convert to strings and clean
        cleaned = []
        for c in codes:
            if c is not None:
                val = str(c).strip()
                if val and val != "":
                    cleaned.append(val)
        # Deduplicate preserving order
        seen = set()
        unique = []
        for c in cleaned:
            if c not in seen:
                seen.add(c)
                unique.append(c)
        return unique
    except Exception as e:
        logger.error(f"Failed to parse Excel file: {e}")
        raise HTTPException(status_code=400, detail=f"Ungültige Excel-Datei: {str(e)}")


@router.post("/analyze")
async def analyze_stocks(
    stock_codes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_source: str = Form(...),
    period_days: int = Form(60),
    indicators: str = Form(...),
):
    """
    Analyze Taiwan stocks with technical indicators.

    Either stock_codes or file must be provided.
    """
    start_time = time.time()
    settings = get_settings()

    # Validate data_source
    if data_source not in ("shioaji", "yahoo"):
        raise HTTPException(status_code=400, detail="data_source muss 'shioaji' oder 'yahoo' sein")

    # Check Shioaji availability
    if data_source == "shioaji" and not settings.shioaji_enabled:
        raise HTTPException(
            status_code=400,
            detail="Shioaji ist nicht konfiguriert. Bitte SHIOAJI_API_KEY und SHIOAJI_SECRET_KEY in .env setzen.",
        )

    # Parse indicators
    try:
        indicators_list = json.loads(indicators)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="indicators muss ein gültiges JSON-Array sein")

    if not indicators_list:
        raise HTTPException(status_code=400, detail="Mindestens ein Indikator muss ausgewählt sein")

    # Parse stock codes
    codes = []
    if stock_codes:
        codes = parse_stock_codes(stock_codes)
    elif file:
        codes = await parse_excel_codes(file)
    else:
        raise HTTPException(status_code=400, detail="Entweder stock_codes oder file muss angegeben werden")

    if not codes:
        raise HTTPException(status_code=400, detail="Keine gültigen Aktiencodes gefunden")

    # Validate and partition codes
    valid_codes = []
    invalid_results = []
    for code in codes:
        if validate_stock_code(code):
            valid_codes.append(code)
        else:
            invalid_results.append(
                {
                    "code": code,
                    "name": None,
                    "rows": [],
                    "error": "Ungültiger Code (erwartet: 4-6 Ziffern, optional mit Buchstaben)",
                }
            )

    if not valid_codes:
        return {
            "results": invalid_results,
            "source_used": data_source,
            "elapsed_seconds": round(time.time() - start_time, 2),
        }

    # Process stocks concurrently
    async def process_with_semaphore(code: str):
        async with _semaphore:
            return await process_stock(code, data_source, period_days, indicators_list)

    tasks = [process_with_semaphore(code) for code in valid_codes]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle exceptions in results
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            processed_results.append(
                {
                    "code": valid_codes[i],
                    "name": None,
                    "rows": [],
                    "error": f"Verarbeitungsfehler: {str(result)}",
                }
            )
        else:
            processed_results.append(result)

    # Combine valid results with invalid code results
    all_results = invalid_results + processed_results

    elapsed = time.time() - start_time

    return {
        "results": all_results,
        "source_used": data_source,
        "elapsed_seconds": round(elapsed, 2),
    }