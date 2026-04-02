FROM python:3.11-slim-bookworm

# Install system dependencies and TA-Lib C library
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    tar \
    build-essential \
    git \
    && wget https://github.com/ta-lib/ta-lib/releases/download/v0.6.4/ta-lib-0.6.4-src.tar.gz \
    && tar xzf ta-lib-0.6.4-src.tar.gz \
    && cd ta-lib-0.6.4 \
    && ./configure --prefix=/usr \
    && make \
    && make install \
    && cd .. \
    && rm -rf ta-lib-0.6.4 ta-lib-0.6.4-src.tar.gz \
    && apt-get purge -y --auto-remove build-essential wget \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster pip operations
RUN pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml .

# Install dependencies using uv
RUN uv pip install --system -e ".[dev]"

COPY src/ ./src/

# Create cache directory
RUN mkdir -p /app/src/cache

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]