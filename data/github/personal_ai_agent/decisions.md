# Key Decisions — Personal AI Digital Twin

## Decision 1: In-memory session state instead of a database
**What:** Conversation history is stored in a Python dict (`SESSIONS`) in the FastAPI process memory, keyed by session ID.
**Why:** Deliberate simplicity. This was the first deployed chatbot built from scratch, and introducing a Redis or database layer would have added significant complexity to what was primarily a persona and conversation experiment. The accepted tradeoff is that sessions don't survive server restarts — which was acceptable for a personal project at this stage.

## Decision 2: Multi-model fallback chain across 4 Groq models
**What:** The agent tries `llama-3.3-70b-versatile` first, then falls through to `qwen3-32b`, `llama-4-scout`, and `llama-3.1-8b-instant` if any model fails.
**Why:** This was forced by production reality. On Groq's free tier, individual models hit rate limits frequently when there are concurrent users. Rather than returning an error to the user, the fallback chain silently tries the next available model — keeping the agent responsive even under rate pressure.

## Decision 3: Context injected from a plain-text file (`summary.txt`) instead of hardcoded in code
**What:** Arun's background is stored in `me/summary.txt` and read at agent startup — not written directly into the prompt string in code.
**Why:** Flexibility and maintainability. Keeping the persona context in a plain file means it can be updated — adding new projects, updated skills, or revised positioning — without changing any code or triggering a redeployment. It also keeps the codebase clean and separates identity data from application logic.

## Decision 4: Real-time Telegram logging of every chat message
**What:** Every user message and AI response is forwarded to Arun's Telegram bot immediately.
**Why:** Primarily for improving the agent. Seeing exactly what real users were asking — and how the agent was responding — made it possible to identify where the persona context was weak, where answers were off, and what follow-up questions were common. Only the query and response were logged; no user identifiers or personal data were stored.

## Decision 5: History trimmed to last 6 turns
**What:** Conversation history is capped at the last 6 messages before being sent to the LLM.
**Why:** To stay within Groq's context limits, particularly when using smaller fallback models like `llama-3.1-8b-instant` which have tighter context windows. Trimming to 6 turns keeps the conversation coherent without risking context overflow errors across any model in the fallback chain.

## Decision 6: Deployed on Render instead of other hosting options
**What:** The app is hosted on Render rather than alternatives like Railway, Fly.io, or a VPS.
**Why:** Render was suggested as the simplest path to deploying a FastAPI app, and its free tier removed any cost barrier for an initial deployment. The developer experience — connecting a GitHub repo and getting a live HTTPS URL — was straightforward and required minimal configuration beyond setting environment variables.
