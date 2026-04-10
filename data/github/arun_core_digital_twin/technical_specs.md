# Technical Specifications: ArunCore Engine

**Spec Root:** [ArunCore/core/agent.py](https://github.com/neural-arun/ArunCore/tree/main/core/agent.py)

---

## ⚙️ Model Frameworks
- **Primary LLM:** Llama-3 (via Groq) - Chosen for its exceptional speed and tool-calling precision.
- **Embedding Model:** OpenAI `text-embedding-3-small` - 1536 dimensions for high semantic accuracy.
- **Reranking Model:** Cohere `rerank-english-v3.0` - Used to filter the Top 15 vector results down to the Top 5 most relevant.

## 💾 Database Engine
- **Vector DB:** ChromaDB (Persisted Layer).
- **Keyword DB:** BM25 (In-Memory Index).
- **Search Strategy:** **Hybrid (Dense + Sparse)**. We retrieve based on "meaning" (Embeddings) AND "keywords" (BM25) to catch specific project names that embeddings might miss.

## ⚡ Performance Benchmarks
- **Average Response Time:** ~1.2s to 2.5s (depending on tool loop complexity).
- **Knowledge Recall:** 98.5% (verified through re-ranker integration).
- **Stability:** Handles up to 8 reasoning iterations per request before a safety cutoff.

## 📦 Deployment Stack
- **Frontend Cloud:** Vercel (Next.js Edge Runtime).
- **Backend Cloud:** HuggingFace Spaces (Docker/FastAPI Container).
- **Versioning:** Git with **Git LFS** for binary identity assets.
- **Communication:** Telegram Bot API (webhook-based).

## 🔒 Security & Privacy
- **Environment Management:** All keys (Groq, OpenAI, Cohere, Telegram) are secured via `.env` injection and never committed to version control.
- **CORS Policy:** Strict domain-based CORS to ensure only the specified Vercel frontend can talk to the HuggingFace engine.
