FROM python:3.11-slim

WORKDIR /app

# psycopg2 (non-binary parts) and Pillow both need these at build time
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

# Render (and most container hosts) inject $PORT at runtime and expect the
# app to bind to it; default to 5001 for local `docker run`/docker-compose.
CMD gunicorn app:app --workers 1 --bind 0.0.0.0:${PORT:-5001}
