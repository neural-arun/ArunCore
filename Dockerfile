FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Expose port 7860 (HuggingFace Spaces default port)
EXPOSE 7860

# Run the FastAPI server, and only start the public Telegram bot when explicitly enabled
CMD if [ "$RUN_TELEGRAM_PUBLIC_BOT" = "true" ]; then python -m core.bot & fi; uvicorn core.api:app --host 0.0.0.0 --port 7860
