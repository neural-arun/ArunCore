# All Projects Summary — ArunCore Knowledge Base

**Author:** Arun Yadav
**GitHub:** [github.com/neural-arun](https://github.com/neural-arun)
**LinkedIn:** [linkedin.com/in/neuralarun](https://www.linkedin.com/in/neuralarun/)
**Position:** Freelance AI Systems Engineer — RAG pipelines, autonomous agents, production-grade data extractors.

> This document is the definitive, exhaustive data summary of every project, folder, and data source within the ArunCore knowledge base. It is generated from READMEs and documentation across all sub-directories of `/data/`. It is the primary ingestion seed for global summary answers.

---

## Data Directory Overview

The `/data/` directory is the absolute source of truth for ArunCore's semantic memory. It is organized into four top-level folders:

| Folder | Purpose |
|---|---|
| `github/` | Curated engineering documentation per GitHub project (architectures, decisions, READMEs) |
| `linkedin/` | LinkedIn profile summary, experience, and posts |
| `raw/` | Personal narrative, background, and identity context |
| `static/` | Always-loaded system context: public profile + rules of engagement |

---

## Arun's Professional Identity

**Title:** Freelance AI Systems Engineer
**Focus:** RAG pipelines · Autonomous agents · High-scale web scrapers · Agentic orchestration
**Philosophy:**
- **Truth > Hallucination** — strict bounds on knowledge retrieval. Never invent facts.
- **Reliability > Hype** — systems must solve expensive bottlenecks, not just demo well.
- **Build-First** — true understanding comes only from shipping real products under live constraints.

**Core Tech Stack:**
- **Languages:** Python (Advanced OOP), AsyncIO, TypeScript/JavaScript
- **AI & RAG:** LangChain, LangGraph, CrewAI, AutoGen, MCP, RAG pipelines
- **LLMs:** OpenAI API, Groq (Llama-3, Mixtral, Qwen), Cohere Rerank, HuggingFace Inference
- **Data & Vectors:** ChromaDB, Pinecone, text-embedding-3-small, Pandas, NumPy
- **Web Automation:** Playwright, playwright-stealth, HTTPX, Asyncio, ScraperAPI, Aiohttp
- **Backend:** FastAPI, Uvicorn, Flask
- **Frontend:** Next.js 15+, React, Vanilla CSS, styled-jsx
- **Infrastructure:** Git LFS, Vercel, HuggingFace Spaces, Render, Docker, Redis, Celery, PostgreSQL

**Short-term goal:** Freelance consulting — delivering high-ROI AI and automation solutions to businesses.
**Long-term goal:** Building scalable, accessible AI products in Healthcare, Education, and Real Estate.

---

## Personal Background

Arun's path into tech was deeply non-linear. He began with an intense focus on competitive medical exams (NEET 2023–2024) before pivoting to engineering via JEE in 2025, where he scored the 95th percentile in the January attempt. A systemic administrative error by his school (PCB subjects filed instead of PCM) blocked engineering counseling — an outcome Arun reframed as the final catalyst to pursue software engineering independently full-time.

**Self-taught origin:** Arun began learning Python on a smartphone using PyDroid 3, without access to a laptop. He moved through tutorials (CodeWithHarry, Apna College, ChaiAurCode) before discovering his real velocity came from active, project-based building — not passive lecture-watching.

**Current academic enrollment:** B.Sc. (Botany, Zoology, Chemistry) at Dr. Ram Manohar Lohia Awadh University, Faizabad — alongside independent self-directed advanced AI engineering study.

**Personal application of AI:** Arun applies AI to practical family tools — including a custom UPSC syllabus/framework tool with AI answer checking for his brother, and an automated expense tracker for managing shared sibling finances.

**Core values shaped by experience:** Do not take things lightly. Verify everything personally. Forge independent paths. Build leverage through undeniable skill.

---

## GitHub Projects — Full Detail

### Tier 1 Projects (Full Engineering Documentation)

---

### 1. ArunCore — AI Digital Twin

**Repository:** [github.com/neural-arun/ArunCore](https://github.com/neural-arun/ArunCore)
**Status:** Active — Production
**Tech Stack:** Python, FastAPI, Uvicorn, Next.js 15+, React, ChromaDB, Cohere Rerank v3.0, Groq (Llama-3 & Mixtral), OpenAI text-embedding-3-small, Telegram Bot API, Git LFS, HuggingFace Spaces, Vercel

**Overview:**
ArunCore is a state-of-the-art AI Digital Twin designed to represent Arun Yadav's identity, technical expertise, and project history in a high-fidelity, interactive environment. It acts as an autonomous professional proxy capable of engaging recruiters, collaborators, and users 24/7 — maintaining 100% cognitive alignment with Arun's actual work history.

**Architecture — 3-Layer Infrastructure:**

- **Presentation Layer (Frontend):** Next.js 15+ with App Router. Vanilla CSS + styled-jsx for precision styling. Implements a Dual-Architecture Layout — detects device type at the React level and renders entirely separate component trees for Desktop vs. Mobile. No CSS media query hacks — the sidebar code is physically absent from the mobile render tree.

- **Intelligence Layer (Backend API):** FastAPI / Uvicorn hosted on HuggingFace Spaces. Uses a Rolling Memory system: every 4 conversation turns, history is summarized and compressed to prevent context window overflow while preserving key project mentions.

- **Data Layer (Hybrid RAG):** ChromaDB vector store indexed with OpenAI text-embedding-3-small. Combines Semantic Vector Search (ChromaDB) with Lexical Search (BM25). Every result is post-processed through Cohere Rerank v3.0 to ensure only the top-N most relevant facts reach the LLM context.

**Agentic Reasoning Loop:**
1. Thought Phase — agent decides if retrieval is needed
2. Tool Phase — calls `search_arun_knowledge` or `notify_arun`
3. Synthesis Phase — merges retrieved documents with identity profile
4. Conclusion — produces final structured Markdown response

**Key Features:**
- Real-time lead alerts via Telegram push when a recruiter or potential collaborator is detected
- Identity Grounding (zero hallucination): explicitly forbidden from inventing skills Arun doesn't have
- 3-Strike Search Budget: hard cap of 3 searches per user message to prevent token burn on unanswerable queries
- High-fidelity branding: SVG social icons, glassmorphism styling, animated chat UI
- Cross-platform: 100dvh viewport management for flawless mobile and desktop performance

**Key Design Decisions:**
- **3-Strike Rule:** Prevents infinite looping on sensitive or subjective questions
- **React-level layout split:** Eliminates CSS inheritance bugs and optimizes mobile memory
- **ReactMarkdown + RemarkGFM:** Renders real tables, bold text, and clickable links in AI output
- **Rolling Memory (every 4 turns):** Allows effectively infinite conversations without context overflow
- **Git LFS for assets:** Migrated profile photos to Git LFS to bypass HuggingFace binary file size limits

---

### 2. Legal RAG System — Indian Legislative Intelligence

**Repository:** [github.com/neural-arun/legal_RAG_system](https://github.com/neural-arun/legal_RAG_system)
**Status:** Completed
**Tech Stack:** Python, LangChain, ChromaDB, Groq (llama-3.3-70b-versatile), OpenAI text-embedding-3-small, pdfplumber, PyPDF

**Corpus:** IPC.pdf, constitution.pdf, case_1.PDF (New India Assurance Co. Ltd. vs Neerja Singh), case_2.PDF (Hira Lal Chaudhary vs State)

**Problem:**
Indian legal material — IPC statutes, the Constitution, and court judgments — is dense, structurally inconsistent, and impossible to search accurately with generic text chunking. Standard RAG pipelines applied to these documents produce poor retrieval because they ignore the real structural units of legal text (sections, articles, paragraph blocks).

**Solution:**
An 8-stage sequential pipeline with document-type-aware chunking strategies. Each stage reads from the output of the previous one — no skipped steps, fully debuggable.

**8-Stage Pipeline:**

| Stage | Script | Input → Output |
|---|---|---|
| 1 | `01_document_manifest.py` | `docs/` folder → `manifest.json` |
| 2 | `02_extract_text.py` | manifest.json → `raw_pages.json` |
| 3 | `03_clean_and_structure.py` | raw_pages.json → `structured_documents.json` |
| 4 | `04_chunk_documents.py` | structured_documents.json → `chunks.json` |
| 5 | `05_validate_chunks.py` | chunks.json → Console validation report |
| 6 | `06_embed_and_index.py` | chunks.json → ChromaDB on disk |
| 7 | `07_query.py` | ChromaDB + chunks.json → Retrieved chunks |
| 8 | `08_answer.py` | Query + retrieval → LLM final answer |

**Document-Aware Chunking:**
- IPC statutes → chunked at **section** boundary (regex `SECTION_START_RE`)
- Constitution → chunked at **article** boundary (regex `ARTICLE_START_RE`), tracking PART headings
- Court judgments → chunked at ORDER/JUDGMENT anchor → 3-paragraph sliding window with 1-paragraph overlap

**3-Tier Retrieval Engine (priority order):**
1. Exact reference match: regex extracts section/article number → direct ChromaDB metadata filter (zero vector lookup)
2. Semantic search: query embedded with text-embedding-3-small → vector similarity in ChromaDB
3. Lexical fallback: term-frequency scoring with domain-specific boosts — runs when ChromaDB is unavailable

**Answer Layer:** Groq llama-3.3-70b-versatile. Strict no-hallucination policy — returns "I do not have information regarding this." when retrieval is insufficient.

**Key Design Decisions:**
- **Document-type-aware chunking:** Generic fixed-size chunking destroys legal semantic units. Section/article/paragraph-aware chunking keeps each reference intact.
- **Sequential numbered scripts:** Deliberate debuggability — each stage re-runnable independently without triggering full pipeline.
- **ChromaDB local-first:** Avoids external API cost and dependency; all offline testing possible.
- **Exact reference extraction before semantic search:** Embedding-based similarity consistently failed on specific section lookups (e.g., "Section 302 IPC"). Regex metadata filter made exact lookups 100% reliable.
- **Groq + llama-3.3-70b:** Significantly faster and cheaper than OpenAI for generation after retrieval is complete.
- **Lexical fallback:** ChromaDB occasionally failed mid-build; fallback ensures query interface never crashes.
- **Validation gate (Stage 5):** Early versions produced bad chunks that polluted ChromaDB. Validation before embedding enforced a quality floor.

---

### 3. 99acres Real Estate Scraper Suite

**Repository:** [github.com/neural-arun/real_state_listing_scraper](https://github.com/neural-arun/real_state_listing_scraper)
**Status:** Completed
**Tech Stack:** Python, Playwright, playwright-stealth, HTTPX (HTTP/2), ScraperAPI, Asyncio, Pandas

**Problem:**
99acres.com is protected by Cloudflare bot detection, which blocks direct HTTP requests with a 403. Property listing data (price, location, size, contact) is distributed across hundreds of dynamic pages, making manual collection slow and scraping technically non-trivial.

**Solution:**
Three independent scrapers implementing progressively more powerful extraction strategies — from free browser automation to professional-grade parallel HTTP scraping via proxy API. All output the same structured CSV.

**Output Schema:** `City`, `Price`, `Location`, `Size (sqft)`, `Contact Info`, `URL`

**The 3 Scrapers:**

**v1 — Semantic Browser Scraper:**
- Playwright + playwright-stealth → headless Chromium
- Scrolls 8 times to trigger lazy-loaded property cards
- Locates price elements by anchoring on the ₹ currency symbol (semantic anchor, not CSS class)
- Walks up DOM with XPath to identify the full property card
- Deduplicates via `set()` of card text content
- Free, no API key. Slower due to browser overhead.

**v2 — Deep Browser Scraper:**
- Also Playwright, but clicks into every individual listing page
- Higher data quality (fewer N/A fields), slower due to per-page browser navigation

**v3 — Parallel HTTP Scraper (production-grade):**
- No browser — uses async HTTP/2 via HTTPX routed through ScraperAPI residential proxies
- Phase 1: `asyncio.gather` fetches all search pages simultaneously → parses `<script type="application/ld+json">` JSON-LD `ItemList` tags for (name, url) pairs
- Phase 2: Per-property detail pages fetched concurrently, throttled by `asyncio.Semaphore(5)` → JSON-LD first (Apartment/House/LandParcel schema), text-scan regex fallback for N/A fields
- Outputs per-run data quality summary (fill rate per column) + CSV export

**Key Design Decisions:**
- **Three scrapers instead of one:** Each version was built when the previous hit a wall — v1 too many N/As, v2 too slow, v3 the production solution.
- **playwright-stealth:** Raw Playwright was detectable. playwright-stealth patches navigator.webdriver, user-agent inconsistencies, and other automation fingerprints.
- **₹ semantic anchoring (v1):** 99acres obfuscates and changes CSS class names. Anchoring on ₹ is intrinsic to content — robust to any site markup change.
- **JSON-LD as primary data source (v3):** 99acres embeds machine-readable structured SEO data in JSON-LD — consistently formatted, unaffected by layout/CSS changes. Cleaner than scraping rendered elements.
- **ScraperAPI over custom proxy rotation:** Free proxy lists had high failure rates. ScraperAPI provides managed residential proxies with built-in Cloudflare bypass and CAPTCHA solving.
- **Semaphore(5):** Without throttling, hundreds of concurrent requests caused connection errors and rate-limit triggers. Semaphore(5) eliminated timeouts and reduced block risk.

---

### 4. Personal AI Digital Twin

**Repository:** [github.com/neural-arun/personal_ai_agent](https://github.com/neural-arun/personal_ai_agent)
**Status:** Deployed (Live on Render)
**Live URL:** [https://personal-ai-agent-96aq.onrender.com](https://personal-ai-agent-96aq.onrender.com)
**Tech Stack:** Python, FastAPI, Uvicorn, Groq (multi-model fallback chain), OpenAI SDK, Telegram Bot API, HTTPX

**Problem:**
Building a professional presence that works 24/7 is hard when you're also building. Most personal websites are static — they don't engage visitors, can't answer questions, and miss potential clients or collaborators entirely.

**Solution:**
A deployed AI agent that speaks as Arun, answers questions about his background, skills, and projects, and captures lead contact details automatically — without Arun needing to be present.

**Architecture:**

- **`app.py`:** FastAPI setup. Mounts static chat UI, serves `index.html` at root, binds to `PORT` env var for Render.
- **`api.py`:** Single `POST /chat` endpoint. Manages per-session history in `SESSIONS` dict (keyed by session_id). Triggers Telegram push on new session start. Forwards every message and response to Telegram in real time.
- **`services/me_agent.py` (the `Me` class):** Reads `me/summary.txt` at startup → builds persona system prompt. Runs agentic tool-calling loop up to 3 iterations per message. Multi-model fallback chain: `llama-3.3-70b-versatile` → `qwen3-32b` → `llama-4-scout` → `llama-3.1-8b-instant`. Strips `<function=...>` artifact tags that Llama 3 occasionally leaks.
- **`services/tools.py`:** `save_lead` (saves hiring/collaboration contacts locally), `save_unknown_questions` (logs unanswered queries for Arun to review), `push` (Telegram HTTP notifications).
- **`me/summary.txt`:** Plain-text persona file — the source of truth for the agent's voice.

**Key Features:**
- Persona context injection from plain-text file (no hardcoded prompts)
- Full tool-calling agentic loop (up to 3 iterations per message)
- Multi-model fallback chain across 4 Groq models — silent failover on rate limits
- Lead capture with Telegram notification
- Session memory (trimmed to last 6 turns for context control)
- Real-time Telegram logging of every chat exchange

**Key Design Decisions:**
- **In-memory session state:** Deliberate simplicity — no Redis/database for a first deployed chatbot. Sessions don't survive restarts; accepted tradeoff.
- **4-model fallback chain:** Forced by production reality — Groq free tier rate limits hit frequently under concurrent users. Silent fallback keeps agent responsive.
- **Context from `summary.txt`:** Keeping persona in a plain file means updates (new projects, skills) require no code changes or redeployment.
- **Telegram logging:** Real-world query logs used to identify weak persona context and improve agent answers.
- **History trimmed to 6 turns:** Stays within smaller fallback model context limits (especially `llama-3.1-8b-instant`).
- **Render hosting:** Simplest FastAPI deployment path — GitHub repo connected, HTTPS URL provided, minimal config beyond env vars.

---

### 5. UPPSC PCS 2024 Statistical Audit

**Repository:** [github.com/neural-arun/result_anomaly](https://github.com/neural-arun/result_anomaly)
**Status:** Completed
**Tech Stack:** Python, pdfplumber, Regex, Pandas, JSON

**Problem:**
The UPPSC PCS 2024 examination results (Prelims → Mains → Final) are publicly available PDFs, but no one had run a systematic numerical analysis on the distribution of selections across roll number series. A visual scan suggested an unusual concentration of final seats going to candidates with roll numbers starting with `00` and `01`.

**Solution:**
A two-script Python pipeline that extracts every roll number from official UPPSC PDFs using regex, groups them by first two digits (series prefix), and tracks how each series group survived across all three exam stages.

**Key Findings:**
- **00 & 01 Series:** 4,927 candidates → 441 final seats — selection rate: **8.95%**
- **02–05 Series:** 10,139 candidates → 492 final seats — selection rate: **4.85%**
- Candidates from 02–05 were more than double in number but secured nearly identical seats
- Statistical excess: **+136 seats** above proportional expectation for the 00 & 01 group
- Concentration compounded at every stage: 32.7% at prelims → 41.8% at mains → 47.3% of final selections

**Architecture:**

- **`extract_counts.py`:** Opens each of the three PDFs with pdfplumber. Extracts all text page by page. Applies regex `\b\d{7}\b` to find 7-digit roll numbers (6-digit fallback). Groups by first two digits. Writes `counts.json`.
- **`verify_extraction.py`:** Validates total counts against officially published figures (15,066 prelims / 2,720 mains / 933 final) — confirms no candidates missed or double-counted.
- **`report.md`:** Four analysis tables (prelims baseline, prelims→mains survival, mains→final conversion, end-to-end selection rate) with expected vs. actual variance.

**Edge Cases Handled:**
- Mains PDF cover page (non-data page 1) skipped with `skip_page_1=True`
- 6-digit roll number fallback regex for UPPSC-specific format variation
- Independent verification before series analysis — fully reproducible and publicly defensible

**Key Design Decisions:**
- **pdfplumber:** Handles raw text extraction from government-style PDFs with inconsistent layouts.
- **Regex over table parsing:** UPPSC PDFs contain many non-roll-number numeric values. Regex targeting the 7-digit pattern was more precise than column alignment assumptions.
- **Series grouping by first 2 digits:** Natural isolation of the anomaly — aligns with how UPPSC assigns roll number series.
- **Verification script first:** Source data is official government results. Extraction integrity had to be independently provable before any statistical claims.
- **Mains page-1 skip:** Cover page contained no roll numbers — including it risked pulling stray numbers from layout text.

---

## GitHub Projects — Tier 2 (Breadth Projects)

---

### 6. Agentic AI Projects — Mini-Agent Collection

**Repository:** [github.com/neural-arun/Agentic_AI_Projects](https://github.com/neural-arun/Agentic_AI_Projects)
**Status:** Completed / Learning Archive
**Tech Stack:** Python, OpenAI SDK, FastAPI, Gradio, Pydantic, tiktoken, HTTPX, tenacity

A collection of 4 agentic AI mini-projects built to explore tool-calling loops, multi-step LLM orchestration, and agent design patterns. Each project is a standalone experiment around a specific agentic use case.

**Sub-Projects:**

- **01 — AI Auditor (`01_AI_auditor/`):** An LLM agent that audits content or data against defined criteria. Includes async version (`async_auditor.py`) and two iterative versions (`auditor.py`, `auditorv2.py`). Focus: structured LLM evaluation with iterative improvement.
- **02 — Cold Email Outreach Agent (`02_cold_email_outreach/`):** Generates and manages personalised cold email drafts. Reads context from a `me/` folder, uses LLM generation to produce targeted outreach copy.
- **03 — What I Can Do Bot (`03_what_I_can_do_bot.py/`):** Capabilities-focused conversational agent answering questions about Arun's skills and services. A focused single-purpose persona agent experiment.
- **04 — Personal Career Agent (`04_personal_career_agent/`):** Earlier prototype of the personal AI agent concept — the direct predecessor to the deployed `personal_ai_agent` project.

---

### 7. Web Wizard — Playwright Automation Curriculum

**Repository:** [github.com/neural-arun/web_wizard](https://github.com/neural-arun/web_wizard)
**Status:** Work in Progress (Active Learning Repository)
**Tech Stack:** Playwright, pytest, Pandas, SQLAlchemy, PostgreSQL, Redis, Celery, Docker, ChromaDB, LangChain

A structured, progressive learning repository for advanced web automation and scraping using Playwright for Python. Covers a full 12-module curriculum from browser automation basics through to distributed, AI-integrated crawler architectures.

**Curriculum Structure:**
- **Part 1 — Foundations:** Python async, HTTP internals, DOM, DevTools, Playwright core API, network interception, debugging
- **Part 2 — Advanced Scraping:** Anti-bot & stealth, async concurrency, Postgres/Pandas integration, Docker + pytest CI
- **Part 3 — Production & AI:** Infinite scroll, SPAs, multi-step auth, Celery/RabbitMQ orchestration, Playwright as an LLM agent tool

**Hands-On Projects Planned:**
1. Single-page scraper with CSV export
2. Login-protected scraper
3. Infinite-scroll scraper with deduplication
4. XHR-intercept scraper
5. Multi-user crawler writing to Postgres
6. Playwright-agent connector for LLM/RAG workflows
7. Capstone: Distributed, Dockerized crawler with queue + vector DB pipeline

---

### 8. Neural Arun Labs — Utility Scripts & Experiments

**Repository:** [github.com/neural-arun/neural_arun_labs](https://github.com/neural-arun/neural_arun_labs)
**Status:** Completed
**Tech Stack:** Python, pathlib, Playwright, Pandas

A personal lab repository containing small, practical utility scripts and scraping experiments. Built for real use — not tutorials.

**Sub-Projects:**

- **01 — File Organiser (`01_file_organiser/`):** Auto-sorts any folder into 4 subdirectories: `PDFs/`, `Videos/`, `Images/`, `Others/`. Scans the directory, detects file extensions, creates destination folders if missing, and moves files. Built as a genuine daily-use utility.
- **02 — Real Estate Scraping Experiment (`02_real_estate_scraping/`):** Early scraping experiment targeting real estate listing data. Foundation and research ground for the more mature `real_state_listing_scraper` project. Contains raw data CSVs and exploration scripts.

---

## LinkedIn Profile Data

**Headline:** Freelance AI Systems Engineer | Architecting RAG Pipelines, Autonomous Agents, & Production-Grade Data Scrapers

**Experience:**
- **Role:** Freelance AI Systems Engineer
- **Period:** May 2025 – Present
- **Key achievements:**
  - Designed a custom anti-hallucination Legal RAG system for Indian laws and court judgments (LangChain, ChromaDB)
  - Engineered an asynchronous, bot-bypassing scraper suite handling 3,000+ dynamic real estate listings without IP bans (Playwright-stealth, HTTPX)
  - Deploying ArunCore — a personalized tool-calling digital twin with FastAPI and real-time Telegram lead capture

**Education:**
- Dr. Ram Manohar Lohia Awadh University, Faizabad — Bachelor of Science
- Self-directed advanced AI engineering: CrewAI, LangGraph, AutoGen, Model Context Protocol (MCP)

**Engineering Philosophy:**
- Reliability > Hype
- Truth > Hallucination
- Automation > Manual Effort

---

## Static Identity Context

**`public_profile.md`** (loaded on every query — system-level context):
> Position: Freelance AI Systems Engineer — RAG pipelines, autonomous agents, high-scale data extractors.
> Socials: LinkedIn, Twitter/X, GitHub (all under neural-arun handle).
> Short-term: Freelance consulting for high-ROI AI/automation solutions.
> Long-term: Scalable AI products in Healthcare, Education, Real Estate.

**`rules_of_engagement.md`** (agent behavioral constraints):
- Truth-only rule: never speculate or fill gaps with plausible-sounding information
- Source citation requirement: every factual claim must be traceable to source documents
- Fallback behavior: explicit statement when information is not available
- Tone: professional, direct, first-person as Arun's proxy
- Refuses to answer certain categories (e.g., salary expectations, private personal information)

---

## Cross-Project Technology Summary

| Domain | Technologies Used |
|---|---|
| AI / LLM | Groq (Llama-3.3-70b, Qwen3-32b, Llama-4-Scout, Llama-3.1-8b), OpenAI, Cohere Rerank v3.0 |
| RAG | ChromaDB, text-embedding-3-small, BM25, LangChain, HuggingFace Inference |
| Web Scraping | Playwright, playwright-stealth, HTTPX (HTTP/2), ScraperAPI, Asyncio |
| Backend | FastAPI, Uvicorn, Flask |
| Frontend | Next.js 15+, React, Vanilla CSS, styled-jsx, ReactMarkdown, RemarkGFM |
| Data | pdfplumber, Pandas, NumPy, JSON, Regex |
| Infrastructure | HuggingFace Spaces, Vercel, Render, Git LFS, Docker, Redis, Celery, PostgreSQL |
| Notifications | Telegram Bot API |
| Orchestration | LangGraph, CrewAI, AutoGen, MCP (in learning) |

---

*End of All Projects Summary. Source: all READMEs and documentation files across `/data/github/`, `/data/raw/`, `/data/linkedin/`, and `/data/static/`.*
