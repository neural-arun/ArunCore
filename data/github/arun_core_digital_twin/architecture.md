# System Architecture: ArunCore

**Core Codebase:** [ArunCore/core](https://github.com/neural-arun/ArunCore/tree/main/core)

---

## 🏗️ 3-Layered Infrastructure
ArunCore is built on a modern, decoupled architecture designed for speed, scalability, and modularity.

### 1. The Presentation Layer (Frontend)
- **Framework:** Next.js 15+ (App Router).
- **Style Engine:** Vanilla CSS + `styled-jsx` for precise, premium aesthetics.
- **Dynamic Views:** Implemented a **Dual-Architecture Layout**. Unlike standard "responsive" sites, ArunCore detects the device type and renders physically different component trees for Desktop vs. Mobile to ensure a zero-compromise experience.
- **Rendering:** [ArunCore/frontend/app/page.tsx](https://github.com/neural-arun/ArunCore/tree/main/frontend/app/page.tsx)

### 2. The Intelligence Layer (Backend API)
- **Framework:** FastAPI / Uvicorn.
- **Hosting:** HuggingFace Spaces.
- **Logic:** [ArunCore/core/api.py](https://github.com/neural-arun/ArunCore/tree/main/core/api.py)
- **State Management:** Uses a **Rolling Memory** system that summarizes conversation history every 4 turns to keep context high without hitting LLM token limits.

### 3. The Data Layer (Hybrid RAG)
- **Vector Store:** ChromaDB.
- **Indexing Engine:** [ArunCore/core/ingest.py](https://github.com/neural-arun/ArunCore/tree/main/core/ingest.py)
- **Hybrid Retrieval System:** Combines Semantic Vector Search (Chroma) with Lexical Search (BM25). 
- **Reranking:** Every result is processed through a **Cohere Rerank v3.0** model to ensure that only the Top-N most relevant project facts reach the LLM's context.

## 🔄 The Agentic Reasoning Loop
Instead of a simple "Prompt -> Answer" chain, ArunCore uses an **Iterative Loop**:
1. **Thought Phase**: Agent decides if it needs data.
2. **Tool Phase**: Agent calls `search_arun_knowledge` or `notify_arun`.
3. **Synthesis Phase**: AI merges retrieved documents with its identity profile.
4. **Conclusion**: Produces a final, structured Markdown response.

## 📡 Integrations
- **Webhooks**: Direct integration with Telegram API for instant notifications.
- **Cloud Storage**: Database and project binary files (images/icons) managed via **Git LFS** and HuggingFace storage.
