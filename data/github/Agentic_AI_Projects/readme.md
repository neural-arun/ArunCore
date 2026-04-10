# Agentic AI Projects

## What This Is
A collection of 4 agentic AI mini-projects built to explore tool-calling loops, multi-step LLM orchestration, and agent design patterns. Each project is a focused, standalone experiment around a specific agentic use case.

## Projects

### 01 — AI Auditor (`01_AI_auditor/`)
An LLM agent that audits content or data against a defined set of criteria. Includes an async version (`async_auditor.py`) and two iterative versions (`auditor.py`, `auditorv2.py`). Focus: structured LLM evaluation with iterative improvement.

### 02 — Cold Email Outreach Agent (`02_cold_email_outreach/`)
An agent that generates and manages personalised cold email drafts. Reads context from a `me/` folder and uses LLM generation to produce targeted outreach copy.

### 03 — What I Can Do Bot (`03_what_I_can_do_bot.py/`)
A capabilities-focused conversational agent that answers questions about Arun's skills and services. A focused single-purpose persona agent experiment.

### 04 — Personal Career Agent (`04_personal_career_agent/`)
An earlier prototype of the personal AI agent concept — the direct predecessor to the deployed `personal_ai_agent` project.

## Tech Stack
Python, OpenAI SDK, FastAPI, Gradio, Pydantic, tiktoken, httpx, tenacity
