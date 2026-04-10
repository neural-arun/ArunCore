# Architecture — Personal AI Digital Twin

## System Overview
A FastAPI backend serving a glassmorphic chat UI, backed by a tool-calling AI agent that runs on Groq's inference API. The agent is stateful per session (in-memory), speaks in Arun's voice from injected context files, and pushes live notifications to a Telegram bot for every new session and message.

## Components

### Entry Point (`app.py`)
FastAPI application setup. Mounts the static UI at `/static`, serves `index.html` at the root, includes the API router, and binds to the `PORT` environment variable for Render compatibility.

### API Router (`api.py`)
- Single `POST /chat` endpoint
- Manages per-session conversation history in `SESSIONS` dict (keyed by `session_id`)
- Triggers a Telegram push notification on new session start
- Forwards every user message and AI response to Telegram in real time
- Delegates all AI logic to the `Me` agent class

### Agent Core (`services/me_agent.py` — the `Me` class)
The most important module. Responsibilities:
- **Context loading:** Reads `me/summary.txt` at startup to build Arun's persona context
- **System prompt assembly:** Injects persona context + behavioral rules into every LLM request
- **Tool-calling agentic loop:** Runs up to 3 iterations per user message — if the model calls a tool, it executes it and feeds results back into the conversation before generating the final response
- **Multi-model fallback:** Tries 4 Groq models in sequence — any model failure (rate limit, timeout) automatically falls through to the next
- **Artifact cleanup:** Strips `<function=...>` tags that Llama 3 occasionally leaks into output

### Tools (`services/tools.py`)
- `save_lead`: Saves lead contact info locally when the agent detects hiring/collaboration interest
- `save_unknown_questions`: Logs questions the agent couldn't answer for Arun to review later
- `push`: Sends Telegram notifications via HTTP to Arun's bot

### Identity Data (`me/summary.txt`)
Plain-text file containing Arun's professional background — injected directly into the system prompt on every request. This is the source of truth for the agent's persona.

## Data Flow
```
User message (browser)
        ↓
POST /chat (FastAPI)
        ↓
Session history lookup → append user message
        ↓
Me.chat() → build messages [system prompt + history]
        ↓
Groq LLM call (model fallback chain if rate limited)
        ↓
If tool_calls → execute tools → re-invoke LLM (up to 3x)
        ↓
Final response → push to Telegram → return to browser
```

## Deployment
- **Host:** Render (free tier)
- **Port:** Dynamic via `PORT` env var
- **Config:** `.env` for `GROQ_API_KEY` and Telegram bot token
