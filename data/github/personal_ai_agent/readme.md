# Personal AI Digital Twin

## Problem
Building a professional presence that works 24/7 is hard when you're also building. Most personal websites are static — they don't engage visitors, can't answer questions, and miss potential clients or collaborators entirely.

## Solution
A deployed AI agent that speaks as Arun, answers questions about his background, skills, and projects, and captures lead contact details automatically — all without Arun needing to be present. The system runs on Render, notifies Arun on Telegram in real time, and degrades gracefully if any one LLM model hits a rate limit.

## Key Features
- **Persona context injection:** System prompt is built from a `summary.txt` file containing Arun's professional background — the agent speaks with Arun's voice, not a generic assistant's
- **Tool-calling agent loop:** Runs a full agentic chat loop with up to 3 iterations per message, allowing the agent to call tools (lead capture, unknown question logging) before generating the final response
- **Multi-model fallback chain:** Tries `llama-3.3-70b-versatile` → `qwen3-32b` → `llama-4-scout` → `llama-3.1-8b-instant` in sequence — if any model hits a rate limit, the next one takes over automatically
- **Lead capture:** Detects hiring/collaboration intent and calls a tool to save lead info locally and push a Telegram notification to Arun's phone
- **Session memory:** In-memory conversation history per session, trimmed to the last 6 turns to keep token usage under control
- **Real-time Telegram logging:** Every chat message and AI response is forwarded to Arun via Telegram bot
- **Live deployment:** Hosted on Render with dynamic port binding via `PORT` environment variable

## Live URL
[https://personal-ai-agent-96aq.onrender.com](https://personal-ai-agent-96aq.onrender.com)
