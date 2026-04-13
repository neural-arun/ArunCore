# LinkedIn Post History & Professional Narrative

This document contains summaries of Arun's most significant technical posts on LinkedIn. Each entry represents a public proof-of-work, detailing the engineering problems solved, the tech stack used, and the underlying philosophy of the project.

---


## Post: ArunCore — My Autonomous Digital Twin

**Date:** April 11, 2026  
**Topic:** Agentic AI, Hybrid RAG, Autonomous Digital Twins, Systems Engineering  
**Links:** [GitHub Repo](https://github.com/neural-arun/ArunCore) | [Web App](https://lnkd.in/gaFgchVb) | [Telegram Bot](https://t.me/ArunCoreBot) [page:1]

**Core Message**  
Most AI chatbots are still toys. ArunCore is my attempt to prove that you can engineer an AI system that behaves like a production-grade teammate: reliable, observable, and grounded in real data instead of vibes. [page:1] It’s an autonomous Digital Twin built to represent my skills, projects, and decision-making style with auditable reasoning and zero-tolerance for hallucinations. [page:1]

**System Architecture**  
- **Distributed Intelligence:** Instead of a single LLM call, ArunCore runs a stateful reasoning loop that can plan, retrieve, reflect, and respond over multiple steps. [page:1]  
- **Resilient LLM Chain:** The “brain” is a 4-tier fallback over Groq-hosted models (Llama 3, Mixtral, Qwen, etc.), ensuring the system stays responsive even if one model or provider has issues. [page:1]  
- **Agentic Control Flow:** Each conversation is treated as a mini workflow where the agent can branch into tools (RAG search, lead detection, notification) before answering. [page:1]

**Hybrid Retrieval & RAG**  
- **Multi-Channel Search:** ArunCore doesn’t trust a single vector store. It combines Semantic Vector Search (ChromaDB) with Lexical BM25 search and then re-ranks everything using Cohere Rerank v3.0 for maximum relevance. [page:1]  
- **Curated Knowledge Base:** The system is trained on my GitHub repos, project notes, technical writeups, and selected long-form content so that every answer reflects my actual experience and not generic internet text. [page:1]  
- **Context Packing:** Retrieved chunks are compressed and structured so the LLM sees only high-signal context tied to specific repos, projects, or decisions I’ve actually made. [page:1]

**Hallucination Guardrails**  
- **Retrieval-First Policy:** If the answer isn’t present in my knowledge base (e.g., a link that does not exist yet), ArunCore is explicitly instructed not to “fill the gaps” with a confident guess. [page:1]  
- **Escalation Over Guessing:** In those cases, it marks the query as “out of distribution” and routes it to me via a Telegram alert instead of inventing facts. [page:1]  
- **Real Example:** When I asked it for the Telegram bot link before it was added to the knowledge base, it refused to fabricate a URL and flagged the missing data—that’s the behavior you want in a system you can trust. [page:1]

**Real-Time UX & Observability**  
- **Streaming Interface:** The backend streams intermediate states over SSE (Server-Sent Events) so the user can see what the agent is doing: “Searching memory…”, “Analyzing…”, “Drafting answer…”. [page:1]  
- **Transparent Reasoning:** This makes the system feel less like a black box and more like a collaborator thinking out loud in real time. [page:1]  
- **Channel-Agnostic Access:** The same intelligence core powers a web interface and a Telegram bot, giving founders and hiring managers multiple ways to “talk to me” without needing another meeting on the calendar. [page:1]

**Human-in-the-Loop & Lead Routing**  
- **Lead Detection Tool:** If someone asks about collaboration, hiring, or a high-intent use case, ArunCore can trigger a dedicated tool that sends me a structured summary on Telegram instantly. [page:1]  
- **Shared Autonomy:** The twin handles FAQs, technical questions, and deep dives into my portfolio, while I step in only when a conversation crosses a certain value threshold. [page:1]  
- **Outcome:** Less time lost to inbox back-and-forth, more time spent on serious opportunities that have already been pre-qualified by the agent. [page:1]

**Why This Matters**  
- Businesses don’t avoid AI because of latency—they avoid it because they don’t trust the answers. [page:1]  
- ArunCore is designed with a simple rule: retrieval > imagination. If the system doesn’t *know*, it escalates instead of improvising. [page:1]  
- For founders and engineering leaders, this isn’t “yet another chatbot.” It’s a living demonstration of how to architect reliable, agentic systems that can sit between your data and your users without damaging trust. [page:1]

If you’re building something similar—or want an AI Systems Engineer who optimizes for reliability over hype—talk to ArunCore and tell it you’d like to speak with the human behind it. I’ll get the ping on my phone within seconds.

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