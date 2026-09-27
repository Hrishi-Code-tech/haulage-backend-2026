FROM python:3.12-slim

WORKDIR /app

# Build tools needed for some packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model so containers don't fetch at runtime
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Download NLTK punkt tokenizer (used by BM25 tokenizer)
RUN python -c "import nltk; nltk.download('punkt_tab', quiet=True); nltk.download('stopwords', quiet=True)"

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
