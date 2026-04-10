# Core Engine Module (`/core/`)

This directory houses the neural and structural Python backend of ArunCore. It is responsible for intercepting network requests, parsing intent using LLMs, searching databases, and coordinating external Telegram tools.

## Key Files & Architectures

### `api.py` (The Networking Boundary)
*   **Framework:** FastAPI.
*   **Purpose:** Exposes a clean `/chat` REST endpoint. It handles CORS for the Next.js client, parses session variables, and wraps around `agent.py` to trigger the AI workflow.

### `agent.py` (The Reasoning Loop)
*   **Framework:** LangChain & Groq (LLaMA inference).
*   **Purpose:** Houses the multi-step reasoning protocol. 
*   **Mechanism:** Implements a heavily supervised generic routing function. The LLM is handed strict parameters (e.g., "Max 3 Database Searches") and is forced to output specific JSON tool invocations (`notify_arun` or `search_arun_knowledge`). It also houses the `RollingMemory` class to compress old context dynamically.

### `ingest.py` (The RAG Compiler)
*   **Framework:** LangChain Document Loaders + OpenAI Embeddings.
*   **Purpose:** Automates the indexing pipeline. It crawls `../data/`, parses Markdown and JSON structs, runs text through structural chunkers, and calculates dense vector graphs, persisting them into the Chroma local database.

### `bot.py` (The Telegram Integration)
*   Provides a direct conversational hook, allowing me (Arun) or authorized users to test the agent purely through a mobile Telegram interface without opening the web browser.
