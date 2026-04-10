# 🧠 Core Engine: The ArunCore Logic

This directory contains the primary execution logic for the ArunCore RAG Agent. It is divided into three functional layers: Ingestion, Reasoning (the Agent), and Auditing.

---

## 🛠️ Components

### 1. `ingest.py` (The Knowledge Constructor)
**Purpose:** Handles the transformation of raw markdown files into a high-performance vector and lexical database.
- **Decision: Semantic Header-Aware Splitting:** We use `MarkdownHeaderTextSplitter`. 
    - *Why?* Character-based splitting breaks sentences mid-thought. Header splitting ensures each chunk "remembers" its context (e.g., a bullet point about a project knows it belongs to the "Project X" section because the header is injected into metadata).
- **Decision: Incremental Hashing:** Every file's content is hashed (MD5) during ingestion.
    - *Why?* To save costs and time. The system only re-embeds files that have changed, skipping those already in the DB.

### 2. `agent.py` (The Interactive Brain)
**Purpose:** The entry point for user interaction. It uses a Stateful Tool-Calling architecture.
- **Decision: Option B Architecture (Tool-Calling):** Instead of a fixed pipeline, we give the LLM a "Search Tool".
    - *Why?* An agent that "chooses" to search is smarter. It can decide to search multiple times for complex queries or skip searching for small talk ("Hi").
- **Decision: Hybrid Retrieval Ensemble (0.7/0.3):** We merge OpenAI Embeddings (Vector) with BM25 (Lexical).
    - *Why?* AI often misses exact names (like "99acres") in vector space. BM25 ensures technical keywords are never lost.
- **Decision: Two-Stage Reranking:** We use Cohere's Rerank-v3.
    - *Why?* A second model (the Cross-Encoder) re-scores the Top 20 results, ensuring the Final Top 5 are the absolute best matches for the LLM.
- **Decision: Rolling Memory & Summary:**
    - *Why?* To handle long chats without running out of context. Every 4 user messages, a "Fast LLM" (Llama 8B) summarizes the chat history to keep the "Heavy LLM" (Llama 70B/120B) fast and cheap.

### 3. `evaluate.py` (The Audit Suite)
**Purpose:** A rigorous test-runner that grades the agent's performance.
- **Decision: Dual-Audit Metric:** Checks for both `Retrieval Accuracy` (did we find the right file?) and `Generation Accuracy` (did we mention the key topics?).
- **Decision: Fuzzy Topic Matching:**
    - *Why?* Exact phrase matching is too brittle. We use a word-overlap threshold to allow the AI to speak naturally while still verifying technical facts.

---

## 🏗️ Execution Flow
1. **User Query** enters `agent.py`.
2. **Rolling Memory** injects past context.
3. **LLM** decides whether to call `search_arun_knowledge`.
4. **Hybrid Search** triggers (Vector + BM25) -> **Cohere Rerank** -> Returns top 5 strings.
5. **LLM** synthesizes the final response.
6. **Telegram Tool** triggers if a Lead is captured or an error occurs.
