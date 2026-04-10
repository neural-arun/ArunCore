---
title: ArunCore
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
---

# 🤖 ArunCore: High-Precision AI Digital Twin

ArunCore is a **State-of-the-Art RAG Agent** architected to act as a transparent, first-person proxy for Arun Yadav. It is designed to solve the "hallucination problem" in personal AI by utilizing a sophisticated, multi-layered retrieval and grounding pipeline.

## 🌟 Live Ecosystem
| Interface | URL | Status |
|---|---|---|
| **Web UI** | [aruncore.vercel.app](https://aruncore.vercel.app) | 🟢 Live |
| **Telegram Bot** | Talk to @Arun_Core_Bot | 🟢 Live |
| **Backend API** | [HuggingFace Spaces](https://huggingface.co/spaces/neural-arun/ArunCore) | 🟢 Online |

---

## 🏗️ Technical Architecture

ArunCore is built using a **Decoupled Three-Tier Architecture**:

### 1. The Brain (Core Agent Engine)
- **Engine**: LangChain + Groq (Llama-3-70B) for reasoning.
- **RAG Strategy**: Manual Hybrid Search (Vector + BM25) with **Cohere Reranking**. This ensures that the AI only "knows" what is explicitly in the database.
- **Stateful Memory**: Custom `RollingMemory` class that triggers a background "Fast-LLM" (Llama-8B) for summarization, maintaining perfect conversational flow without hitting token limits.

### 2. The Multi-Channel API
- **FastAPI**: A high-performance backend serving the `/chat` endpoint.
- **Session Management**: Maps unique session IDs to isolated memory buffers, allowing hundreds of users to talk simultaneously without cross-talk.
- **Telegram Bridge**: A parallel process using `python-telegram-bot` with a custom Regex-to-HTML parser to deliver perfectly formatted mobile experiences.

### 3. The Frontend
- **Next.js 14**: A premium dark-mode Chat UI.
- **Rich Interaction**: Real-time typing indicators, session persistence via `sessionStorage`, and fluid animations.

---

## 📁 Repository Structure

- [**/core**](./core): The logic layer. Contains the Agent loop, RAG pipeline, FastAPI server, and Telegram Bot.
- [**/data**](./data): The knowledge base. Includes raw markdown, GitHub repo context, and LinkedIn history.
- [**/db**](./db): Persistent ChromaDB vector store (Managed via Git LFS).
- [**/frontend**](./frontend): The Next.js web application.
- [**/docs**](./docs): Detailed workflows and system design documents.

---

## 🚀 Deployment Strategy

- **Backend**: Hosted on **HuggingFace Spaces** using a custom **Docker** container. Both the API and Bot run in a single container for maximum resource efficiency.
- **Frontend**: Hosted on **Vercel** for lightning-fast global delivery.
- **Storage**: Uses **Git LFS** (Large File Storage) to push binary vector databases to GitHub, allowing "Battery-Included" deployment.

---

## 🛠️ How I Built It (Key Engineering Decisions)
- **Why Manual RRF?** I implemented manual Reciprocal Rank Fusion (0.7 Vector / 0.3 Keyword) to bypass library limitations and ensure technical project queries (like "Legal RAG") are prioritized over general chat.
- **Why HTML Fallback?** Telegram's Markdown parser is fragile. I engineered a regex-based HTML converter in `bot.py` to guarantee a crash-free mobile experience.
- **The "Veto" Rule**: Added strict prompt engineering to prevent the AI from hallucinating capabilities (e.g., it will never claim to be able to code in Next.js if it hasn't been taught that).

---

## 👤 Author
**Arun Yadav** - AI Systems Engineer  
[LinkedIn](https://www.linkedin.com/in/neuralarun/) | [Twitter](https://x.com/Neural_Arun) | [GitHub](https://github.com/neural-arun)

---
*Powered by ArunCore Engine v1.0*
