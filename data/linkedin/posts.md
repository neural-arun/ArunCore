# LinkedIn Post History & Professional Narrative

This document contains summaries of Arun's most significant technical posts on LinkedIn. Each entry represents a public proof-of-work, detailing the engineering problems solved, the tech stack used, and the underlying philosophy of the project.

---

## Post: The Legal RAG System — Engineering Precision

**Date:** April 5, 2026
**Topic:** AI Systems Engineering, Retrieval-Augmented Generation (RAG), Legal Tech
**Links:** [GitHub Repo](https://github.com/neuralarun/legal_rag) | [LinkedIn Post](https://www.linkedin.com/posts/neuralarun_ai-llm-rag-activity-7306283731998539777-v-p1)

**Core Message**
Moving beyond "shallow" AI wrappers to deep systems engineering. This post tackles the reality that a RAG system is only as good as its ingestion pipeline. The system focuses on the IPC (Indian Penal Code) and the Constitution of India—documents where a single word change can alter a legal outcome.

**Technical Deep Dive**
- **Architectural Strategy:** Rejected generic "chunking" in favor of Structural Awareness. The system understands the hierarchy of legal texts (Statutes by section, Constitution by article, Judgments by paragraph).
- **Metadata Engineering:** Built a precise reference layer. Instead of just returning raw text, the system returns specific citations (e.g., Section 302 IPC), making the AI's answer auditable and grounded.
- **Anti-Hallucination Guardrails:** Implemented strict constraints at the "answer layer" to ensure the LLM doesn't invent laws when retrieval fails.
- **Tech Stack:** Python, LangChain, PyPDF, OpenAI Embeddings, ChromaDB, Groq.

---

## Post: Production-Grade Async Scraper — Scaling & Reliability

**Date:** February 2026
**Topic:** Web Scraping, Asynchronous Programming, System Design
**Links:** [GitHub Repo](https://github.com/neuralarun/async_web_scraper) | [LinkedIn Post](https://www.linkedin.com/posts/neuralarun_shipped-a-production-grade-async-web-scraping-activity-7292797686568910848-Kq-h)

**Core Message**
"Building reliable systems > writing quick scripts." This post details scaling a data extraction task to handle 3,400+ articles across 170+ pages rapidly without a single crash or ban.

**Technical Deep Dive**
- **Concurrency Control:** Used Semaphores within Python's `asyncio` to manage parallel request limits, preventing the system from being flagged as a bot.
- **Crash-Safe Persistence:** Saved data in fixed-size batches. If connection drops or power cuts, only the current small batch is lost, rather than the entire 3,400-article run.
- **Observability:** Implemented structured logging tracking start/end times and durations for every single URL to easily identify bottlenecks.
- **Tech Stack:** Python, `asyncio`, `aiohttp`, BeautifulSoup, JSON.

---

## Post: Specialized AI Expert — The Zero To Mastery Journey

**Date:** October 2025
**Topic:** Prompt Engineering, LLM Orchestration, Rule-Based AI
**Links:** [Full Bootcamp Repo](https://github.com/neuralarun/Prompt-Engineering-Bootcamp-ZTM) | [AI Career Coach](https://github.com/neuralarun/AI-Career-Coach) | [LinkedIn Post](https://www.linkedin.com/posts/neuralarun_promptengineering-llms-ai-activity-7250005706248318976-5q5c)

**Core Message**
Graduation from the Zero To Mastery Prompt Engineering Bootcamp. This marked a pivot from using AI as a simple "chatbot" to orchestrating it as a "reasoning engine" for complex, specific domains like career coaching and education.

**Technical Deep Dive**
- **The Expert Framework:** Built an interactive Career Coach that doesn't just dispense generic advice but follows a logical path based on user inputs.
- **Rule-Based AI:** Engineered prompts for complex rule-following logic (like AI Snake and Tic-Tac-Toe), proving the ability to force an LLM to stick to rigid constraints—a precursor to building reliable medical education tools like NEETPrepGPT.

---

## Post: Game Development — Snake Game Revamp

**Date:** September 2025
**Topic:** Python Development, State Management, Game Loop
**Links:** [GitHub Repo](https://github.com/neuralarun/Snake-Game-Python) | [LinkedIn Post](https://www.linkedin.com/posts/neuralarun_python-pygame-snakegame-activity-7236979243769188352-uXon)

**Core Message**
A focus on the "human-in-the-loop" UI/UX aspect. Took a basic foundational Python project and added professional-grade polish, focusing heavily on event handling and user feedback.

**Technical Deep Dive**
- **Vector Graphics:** Added a moving triangle head that dynamically rotates to face the direction of movement.
- **State Management:** Implemented pause/resume state controls and a dynamic difficulty curve (speed increases dynamically as score increases).
- **Clean Code:** Managed the entire game loop—input, state update, and render—within a single, highly readable and maintainable file.