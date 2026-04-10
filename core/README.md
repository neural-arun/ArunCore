# /core: The Brain & Communication Layer

This directory contains the primary execution logic of the ArunCore agent ecosystem. It is divided into the **Reasoning Engine**, the **Knowledge Ingestion Pipeline**, and the **Interface Bridges**.

## 🛠️ Key Components

### 1. `agent.py` (The Reasoning Engine)
The heart of the system.
- **Stateful Tool-Calling**: Uses an autonomous loop where the AI decides when to use `search_arun_knowledge` or `notify_arun`.
- **Rolling Memory**: A custom class that stores chat history and a running summary.
- **Fast-LLM Summarization**: Uses a lightweight model (Llama-8B) to compress long histories behind the scenes, ensuring the context window never overflows.

### 2. `api.py` (The Web Bridge)
Exposes the agent to the internet via **FastAPI**.
- **Session Isolation**: Every user gets a unique `RollingMemory` instance mapped to their `session_id`.
- **CORS Enabled**: Configured to accept secure requests from the Vercel frontend.

### 3. `bot.py` (The Telegram Bridge)
Provides a native mobile experience.
- **Async Polling**: Constantly listens for Telegram updates.
- **HTML Formatting**: Intercepts LLM Markdown and converts it to Telegram-safe HTML (`<b>`, `<code>`, `<a>`) to prevent parser crashes.

### 4. `ingest.py` & `evaluate.py`
- **Ingest**: Processes raw data into the ChromaDB vector store using Hybrid (Vector + Keyword) indexing.
- **Evaluate**: A custom audit script that tests retrieval accuracy against a "Golden Test Set" to ensure the AI isn't hallucinating Arun's history.

## 📐 Architecture Decision: "The Decoupled Bridge"
I chose to separate `api.py` and `bot.py` into distinct files. While they both use the same agent logic from `agent.py`, this separation allows the Telegram bot to run as a background service while the FastAPI server handles the synchronous web traffic. This ensures that a surge in website visitors never slows down your private Telegram notifications.
