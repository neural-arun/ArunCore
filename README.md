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

> "I don't build brittle AI wrappers. I engineer robust, audited systems."

---

## 🏗️ The Architecture (How I Built It)

ArunCore is built on a **Three-Pillar Intelligence Framework**:

### 1. The Multi-Tier Knowledge Layer
- **Source Material:** Curated Markdown documents covering professional projects (GitHub), personal philosophy (Raw), and public proof-of-work (LinkedIn).
- **Semantic Chunking:** Data is not just cut; it's structurally split using `MarkdownHeaderTextSplitter`. This ensures that technical context (headers) is injected into every single chunk's metadata.
- **Indexing:** Local vector storage using **ChromaDB** with `text-embedding-3-small` for high-dimensional semantic mapping.

### 2. The Hybrid "Recall & Precision" Pipeline
To ensure 100% accuracy, I implemented a **Two-Stage Hybrid Retrieval** engine:
- **Stage 1 (Recall):** A weighted **Ensemble Search** merging:
    - **Semantic Search (0.7 weight):** Captures the "meaning" and concept of the query.
    - **Keyword Search (0.3 weight):** Uses the **BM25 algorithm** to ensure exact technical terms (e.g., "FastAPI", "99acres") are never missed.
- **Stage 2 (Precision):** Candidates are passed to the **Cohere Reranker**. This cross-encoder scores the query against each chunk, picking only the Top 5 most relevant pieces of context.

### 3. The "Iron-Clad" Grounding Rule
Hallucinations are the enemy of trust. I solved this via:
- **The Veto Rule:** A systemic constraint that forces the AI to politely decline requests for services or skills NOT explicitly listed in the verified Tech Stack.
- **Transparent First-Person Proxy:** A persona instruction set that ensures the AI speaks as "Me," but never pretends to be biologically human.

### 4. Agentic Handoff (The Telegram Bridge)
ArunCore isn't just a static knowledge base; it's a lead-capture engine.
- **The Notification Tool:** Integrated with a custom **Telegram Bot API** bridge.
- **Automated Alerts:** Whenever a user shares their contact info, requests a direct meeting, or asks a question beyond the current knowledge base, ArunCore automatically buzzes my phone.
- **Lead Capture Logic:** Seamlessly converts casual chats into actionable career opportunities by capturing and pushing user profiles in real-time.

---

## 💎 The Build: Key Engineering Decisions

Building a Digital Twin that people can trust required more than just "chatting with a PDF." Here are the core decisions that define ArunCore's reliability:

1. **Incremental Ingestion (MD5 Hashing):** I built the ingestion engine to be cost-efficient. It tracks the hash of every local file and only re-indexes what has actually changed, avoiding redundant API costs.
2. **Structural Markdown Splitting:** Instead of generic character-count chunking, I use header-aware splitting. This ensures that every chunk inherits its section title (e.g., "# Tech Decisions") in its metadata, giving the LLM a perfect "Table of Contents" view of the data.
3. **The 0.7/0.3 Hybrid Ensemble:** Pure semantic search often misses technical keywords. By creating a manual fusion of **Vector Search** and **BM25 Lexical Search**, I ensured the system never misses an exact project name or technical term like "99acres" or "Playwright."
4. **Cross-Encoder Reranking:** I don't trust a single similarity score. I implemented a two-stage process where candidates are reranked by a **Cohere Cross-Encoder**. This is the secret sauce for precision—it filters out the "similar sounding" junk and keeps only the "right" answer.
5. **External Loop for Grounding:** By defining "Out of Bounds" scenarios and a strict Veto rule, I've engineered the AI to be its own most honest critic. If it's not certain, it notifies me rather than guessing.

---

## 🧪 The Audit (Continuous Evaluation)
I don't guess if it works; I prove it.
- **Golden Test Set:** A 30-question benchmark covering identity, technical deep-dives, and "negative tests" (trying to trick the AI).
- **Dual-Evaluation Suite:** A custom Python pipeline (`evaluate.py`) that audits every response for:
    - **Retrieval Accuracy:** Did the system find the correct source file?
    - **Generation Accuracy:** Did the answer contain the required technical topics?
- **Debug Logs:** Every interaction is logged into a dedicated audit folder for manual human verification.

---

## 🛠️ The Tech Stack
- **Engine:** Python, LangChain, Groq (Llama 3.3 70B)
- **Retrieval:** ChromaDB, BM25, Cohere Rerank
- **Automation:** Playwright, ScraperAPI (for the data layer)
- **Infrastructure:** Git, Venv, Dotenv

---

## 🧠 Engineering Philosophy
This project represents my core belief: **True engineering isn't about the demo; it's about the edge cases.** ArunCore is built to be reliable under pressure, transparent about its limitations, and deeply grounded in reality.

---
*Created and Engineered by [Arun Yadav](https://github.com/ArunYadav0)*
