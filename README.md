---
title: ArunCore Digital Twin
emoji: 🧠
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# ArunCore: The AI Digital Twin & Agentic Architecture

**ArunCore** is a production-grade, stateful, retrieval-augmented AI agent engineered to serve as my personal digital proxy. It isn't just a simple chatbot; it is a full-stack, hybrid-search intelligence pipeline built to securely and accurately represent my professional background, technical decisions, and portfolio.

This repository contains the entirety of the system: the Python backend (LangChain, ChromaDB, FastAPI), the data ingestion pipeline, and the ultra-optimized Next.js frontend GUI.

---

## 🌟 High-Level Capabilities

1.  **Zero-Hallucination Retrieval System:** Features a custom hybrid-search mechanism combining **ChromaDB (semantic vector search)** using OpenAI Embeddings and a **BM25 Lexical Retriever (keyword exact match)**. This guarantees the AI never guesses or fabricates my experience.
2.  **Cohere Reranking:** All retrieved results pass through Cohere's English V3 Reranker to surface the most contextually relevant chunks before passing them to the final LangChain prompt.
3.  **Stateful Memory Loop:** Implements a rolling-memory summarization engine for conversational context retention without bloating the immediate context window.
4.  **"3-Strike" Loop Control:** The LangChain routing agent has strict limits applied to its tool-calling process (max 3 database searches per query) to prevent endless recursive loops on ambiguous questions.
5.  **Multi-Platform Presentation:** Incorporates a tailored Next.js UI using `ReactMarkdown` and custom styling for a sleek, dark-mode desktop presence with dynamic resizing for mobile compatibility.
6.  **Human-in-the-Loop:** A native tool-call integration with the Telegram API alerts my personal device instantly if a user asks to connect, requires freelance negotiation, or submits a lead.

---

## 🏗️ System Architecture

### 1. The Knowledge Base (`/data/`)
The foundational data driving ArunCore is stored statically.
*   **Static Data (`data/static/`)**: Holds the `public_profile.md` (resume details) and `rules_of_engagement.md` (strict behavioral blueprints for the LLM).
*   **Dynamic Portfolios (`data/github/`)**: Folders containing `overview.md`, `metadata.json`, and `code_summaries.json` for every major project in my career.

### 2. The Engine (`/core/`)
*   **`ingest.py`**: The offline script that chunks all markdown files, vectorizes them using OpenAI Embeddings, and indexes them into ChromaDB.
*   **`agent.py`**: Contains the core `ChatPromptTemplate`, tool bindings (`search_arun_knowledge`, `notify_arun`), and memory mechanics.
*   **`api.py`**: The FastAPI server bridging the backend algorithms to the web client endpoints.

### 3. The Client (`/frontend/`)
A Next.js (TypeScript) single-page application.
*   It maintains session state, handles the "typing" visual queues, manages strict layout breaks for Desktop/Mobile viewports, and overrides raw markdown into visually premium UI components.

---

## 🚀 Quick Start Guide

### Prerequisites
*   Python 3.10+
*   Node.js (LTS Version)
*   Access keys for: OpenAI, Groq, Cohere.

### Backend Setup
1.  **Clone & Install:**
    ```bash
    git clone https://github.com/neural-arun/ArunCore.git
    cd ArunCore
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    ```
2.  **Environment Variables:** Create a `.env` file at the root.
    ```env
    OPENAI_API_KEY=your_key_here
    GROQ_API_KEY=your_key_here
    COHERE_API_KEY=your_key_here
    TELEGRAM_BOT_TOKEN=your_bot_token  (Optional)
    TELEGRAM_CHAT_ID=your_chat_id      (Optional)
    ```
3.  **Bootstrap the Database:** Run the ingestion script to vectorize the data folder.
    ```bash
    python core/ingest.py
    ```
4.  **Launch the Server:** Starts the FastAPI engine.
    ```bash
    uvicorn core.api:app --host 0.0.0.0 --port 8000
    ```

### Frontend Setup
1.  **Install Dependencies:**
    ```bash
    cd frontend
    npm install
    ```
2.  **Launch the UI:** Runs the development server on `localhost:3000`.
    ```bash
    npm run dev
    ```

---

## 📖 Navigation Guide

For a deeper dive into scaling operations, deployment structures, or individual modules, please consult the dedicated internal documentation:
*   [Scaling & Cloud Deployment (`docs/scaling_guide.md`)](docs/scaling_guide.md)
*   [Data Updates (`docs/updating_digital_twin.md`)](docs/updating_digital_twin.md)
*   [Frontend Internals (`frontend/README.md`)](frontend/README.md)
*   [Core Backend Internals (`core/README.md`)](core/README.md)

---
*Built by Arun Yadav — Architecting Autonomous Intelligence.*
