import hashlib
import html
import json
import os
import re
import time
import warnings
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv

from langchain_cohere import CohereRerank
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# =========================================================
# CONFIG
# =========================================================

load_dotenv()

if os.getenv("COHERE_API_KEY"):
    os.environ["CO_API_KEY"] = os.getenv("COHERE_API_KEY", "")

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "db"
STATIC_DIR = BASE_DIR / "data" / "static"

ALLOWED_NOTIFY_CATEGORIES = {"LEAD", "URGENT", "UNKNOWN_QUESTION"}
MAX_SEARCH_RESULTS = 5
MAX_TOOL_ROUNDS = 4
MAX_HISTORY_MESSAGES = 8
NOTIFICATION_COOLDOWN_SECONDS = 300

# =========================================================
# GLOBAL STATE
# =========================================================

_GLOBAL_VECTORSTORE = None
_GLOBAL_BM25 = None
_GLOBAL_COMPRESSOR = None

_RECENT_ALERTS: Dict[str, float] = {}

# =========================================================
# HELPERS
# =========================================================

def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def _safe_truncate(text: str, limit: int = 1500) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def _parse_json_metadata(raw: str) -> Dict[str, Any]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {"value": parsed}
    except Exception:
        return {"raw": raw}


def _alert_key(category: str, user_input: str) -> str:
    digest = hashlib.sha256(
        f"{category}:{user_input.strip().lower()}".encode("utf-8")
    ).hexdigest()
    return digest


def _should_send_alert(category: str, user_input: str) -> bool:
    key = _alert_key(category, user_input)
    now = time.time()
    last_seen = _RECENT_ALERTS.get(key)
    if last_seen and (now - last_seen) < NOTIFICATION_COOLDOWN_SECONDS:
        return False
    _RECENT_ALERTS[key] = now
    return True


def _escape_html(text: str) -> str:
    return html.escape(text or "")


def _contains_uncertainty(text: str) -> bool:
    lowered = (text or "").lower()
    phrases = [
        "i don't know",
        "i do not know",
        "not sure",
        "can't confirm",
        "cannot confirm",
        "i don't have that information",
        "no relevant data found",
        "i'm unsure",
        "i am unsure",
        "i cannot answer",
        "i can’t confirm",
        "i can’t answer",
    ]
    return any(phrase in lowered for phrase in phrases)


def _route_user_input(user_input: str) -> Dict[str, Any]:
    """
    Lightweight router to bias the system toward tool usage.
    """
    text = (user_input or "").strip()
    lower = text.lower()

    explicit_contact_patterns = [
        r"\btalk to arun\b",
        r"\bconnect me to arun\b",
        r"\bcontact arun\b",
        r"\bmessage arun\b",
        r"\bhire arun\b",
        r"\bcollaborate\b",
        r"\bpartnership\b",
        r"\bbusiness\b",
        r"\blead\b",
        r"\bwork with you\b",
    ]

    arun_context_patterns = [
        r"\baruncore\b",
        r"\barun\b",
        r"\byour project\b",
        r"\byour work\b",
        r"\byour github\b",
        r"\bgithub\b",
        r"\brepository\b",
        r"\bportfolio\b",
        r"\barchitecture\b",
        r"\bknowledge base\b",
        r"\bbackground\b",
        r"\bskills\b",
        r"\bexperience\b",
    ]

    uncertainty_patterns = [
        r"\bi don't know\b",
        r"\bnot sure\b",
        r"\bcan you explain\b",
        r"\bwhat does this mean\b",
        r"\bhelp me understand\b",
        r"\bunknown\b",
        r"\bunclear\b",
        r"\bconfused\b",
    ]

    if any(re.search(pattern, lower) for pattern in explicit_contact_patterns):
        category = "URGENT" if any(
            phrase in lower for phrase in ["talk to arun", "contact arun", "connect me to arun", "message arun"]
        ) else "LEAD"
        return {
            "needs_search": False,
            "needs_notify": True,
            "notify_category": category,
            "reason": "explicit_contact_or_business_intent",
        }

    if any(re.search(pattern, lower) for pattern in arun_context_patterns):
        return {
            "needs_search": True,
            "needs_notify": False,
            "notify_category": None,
            "reason": "arun_related_query",
        }

    if any(re.search(pattern, lower) for pattern in uncertainty_patterns):
        return {
            "needs_search": True,
            "needs_notify": False,
            "notify_category": None,
            "reason": "uncertain_query",
        }

    return {
        "needs_search": False,
        "needs_notify": False,
        "notify_category": None,
        "reason": "general_query",
    }


def load_static_context() -> Tuple[str, str]:
    profile_path = STATIC_DIR / "public_profile.md"
    rules_path = STATIC_DIR / "rules_of_engagement.md"

    with open(profile_path, "r", encoding="utf-8") as f:
        profile = f.read()
    with open(rules_path, "r", encoding="utf-8") as f:
        rules = f.read()

    return profile, rules


# =========================================================
# TOOLS
# =========================================================

@tool
def notify_arun(category: str, user_input: str, user_metadata_json: str = "") -> str:
    """
    Sends a Telegram alert to Arun.

    Use this when:
    - The user wants to talk to Arun directly.
    - The query looks like a lead, collaboration, hiring, or business request.
    - The system cannot answer confidently and should escalate the question.

    Args:
        category: One of 'LEAD', 'URGENT', or 'UNKNOWN_QUESTION'.
        user_input: The user's message.
        user_metadata_json: Optional JSON string with extra metadata.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        return "FAILED: Telegram credentials are missing from the environment."

    category = (category or "UNKNOWN_QUESTION").strip().upper()
    if category not in ALLOWED_NOTIFY_CATEGORIES:
        category = "UNKNOWN_QUESTION"

    cleaned_input = _safe_truncate(user_input, 1200)
    metadata = _parse_json_metadata(user_metadata_json)

    if not _should_send_alert(category, cleaned_input):
        return f"SKIPPED: duplicate {category} alert suppressed."

    meta_lines = []
    if metadata:
        for key, value in metadata.items():
            meta_lines.append(f"<b>{_escape_html(str(key))}:</b> {_escape_html(str(value))}")

    meta_block = "\n".join(meta_lines)
    if meta_block:
        meta_block = f"\n\n<b>Metadata</b>\n{meta_block}"

    text = (
        f"🚨 <b>ArunCore Alert</b> 🚨\n\n"
        f"<b>Category:</b> {_escape_html(category)}\n"
        f"<b>Time:</b> {_escape_html(_utc_now())}\n\n"
        f"<b>User Input</b>\n{_escape_html(cleaned_input)}"
        f"{meta_block}"
    )

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            return "SUCCESS: Arun has been notified."
        return f"FAILED: Telegram API returned {response.status_code} - {response.text[:300]}"
    except requests.exceptions.Timeout:
        return "ERROR: Telegram request timed out."
    except requests.exceptions.RequestException as e:
        return f"ERROR: Could not send notification. {str(e)}"


@tool
def search_arun_knowledge(search_query: str) -> str:
    """
    Searches Arun's database for technical details, background, projects, and architecture.
    Use this before answering questions about Arun's history, work, GitHub, projects, or internal details.

    Args:
        search_query: A descriptive standalone query focused on key technical terms.
    """
    global _GLOBAL_VECTORSTORE, _GLOBAL_BM25, _GLOBAL_COMPRESSOR

    if not _GLOBAL_VECTORSTORE or not _GLOBAL_BM25 or not _GLOBAL_COMPRESSOR:
        return "ERROR: Database retrievers are not initialized."

    vec_docs = _GLOBAL_VECTORSTORE.similarity_search(search_query, k=15)
    lex_docs = _GLOBAL_BM25.invoke(search_query)

    seen = set()
    combined: List[Document] = []

    for doc in vec_docs + lex_docs:
        cid = doc.metadata.get("chunk_id") or doc.metadata.get("source") or doc.page_content[:80]
        if cid not in seen:
            seen.add(cid)
            combined.append(doc)

    initial_docs = combined[:20]
    if not initial_docs:
        return "DATABASE SEARCH RESULT: No relevant data found for this query."

    try:
        reranked_docs = _GLOBAL_COMPRESSOR.compress_documents(documents=initial_docs, query=search_query)
    except Exception as e:
        reranked_docs = initial_docs[:MAX_SEARCH_RESULTS]
        if not reranked_docs:
            return f"DATABASE SEARCH RESULT: No relevant data found. Rerank failed: {e}"

    if not reranked_docs:
        return "DATABASE SEARCH RESULT: No relevant data found for this query."

    snippets = []
    for doc in reranked_docs[:MAX_SEARCH_RESULTS]:
        source = doc.metadata.get("source", "unknown")
        chunk_id = doc.metadata.get("chunk_id", "unknown")
        content = _safe_truncate(doc.page_content, 2000)
        snippets.append(f"[Source: {source} | chunk: {chunk_id}]\n{content}")

    return "DATABASE SEARCH RESULT:\n\n" + "\n\n---\n\n".join(snippets)


# =========================================================
# MEMORY
# =========================================================

class RollingMemory:
    def __init__(self, summary_llm, max_turns: int = 4):
        self.summary_llm = summary_llm
        self.max_turns = max_turns
        self.history: List[Any] = []
        self.running_summary: str = "No prior summary. This is the start of the conversation."
        self.invocation_count = 0

    def add_interaction(self, human_text: str, ai_text: str):
        self.history.append(HumanMessage(content=human_text))
        self.history.append(AIMessage(content=ai_text))
        self.invocation_count += 1

        if self.invocation_count >= self.max_turns:
            self._summarize_and_prune()

    def _summarize_and_prune(self):
        print("\n[SYSTEM] Triggering background summarization...")
        messages_to_summarize = self.history[:-4]

        if not messages_to_summarize:
            return

        chat_transcript = "\n".join(
            [f"{'User' if isinstance(m, HumanMessage) else 'ArunCore'}: {m.content}" for m in messages_to_summarize]
        )

        prompt = (
            "You are an internal memory compression engine for ArunCore.\n"
            "Merge the existing summary with the new transcript. Preserve technical context, names, project mentions, user goals, and important decisions. "
            "Keep it concise and stable. Return no more than 5 sentences.\n\n"
            f"--- EXISTING SUMMARY ---\n{self.running_summary}\n\n"
            f"--- NEW CHAT TO MERGE ---\n{chat_transcript}"
        )

        try:
            res = self.summary_llm.invoke([SystemMessage(content=prompt)])
            self.running_summary = res.content.strip()
            self.history = self.history[-4:]
            self.invocation_count = len(self.history) // 2
            print(f"[SYSTEM] Memory compressed. New summary: {self.running_summary[:120]}...")
        except Exception as e:
            print(f"[SYSTEM ERROR] Failed to summarize memory: {e}")

    def get_messages(self):
        return self.history


# =========================================================
# AGENT SETUP
# =========================================================

def init_agent():
    global _GLOBAL_VECTORSTORE, _GLOBAL_BM25, _GLOBAL_COMPRESSOR

    openai_key = os.getenv("OPENAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    cohere_key = os.getenv("COHERE_API_KEY")

    if not openai_key or not groq_key or not cohere_key:
        raise ValueError("Missing API keys. OPENAI_API_KEY, GROQ_API_KEY, and COHERE_API_KEY are required.")

    warnings.filterwarnings("ignore", category=DeprecationWarning)

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=openai_key)

    _GLOBAL_VECTORSTORE = Chroma(
        collection_name="aruncore_knowledge",
        embedding_function=embeddings,
        persist_directory=str(DB_DIR),
    )

    all_data = _GLOBAL_VECTORSTORE.get()
    documents = [
        Document(page_content=text, metadata=metadata or {})
        for text, metadata in zip(all_data.get("documents", []), all_data.get("metadatas", []))
        if text
    ]

    if not documents:
        raise ValueError("Vector database is empty. Run ingest first.")

    _GLOBAL_BM25 = BM25Retriever.from_documents(documents)
    _GLOBAL_BM25.k = 10

    _GLOBAL_COMPRESSOR = CohereRerank(
        top_n=5,
        model="rerank-english-v3.0",
        cohere_api_key=cohere_key,
    )

    summary_llm = ChatOpenAI(
        temperature=0.0,
        model="gpt-5-nano",
        api_key=openai_key,
    )

    tools = [notify_arun, search_arun_knowledge]

    main_llm = ChatOpenAI(
        temperature=0.15,
        model="gpt-4o-mini",
        api_key=openai_key,
    ).bind_tools(tools)

    profile, rules = load_static_context()

    system_prompt = f"""
You are ArunCore, the knowledge system for Arun Yadav. Greet the person like you are Arun.
You speak as Arun in first person. Be honest. Do not guess.
For any question about Arun's projects, skills, background, architecture, GitHub, portfolio, work history, or any stored knowledge, call `search_arun_knowledge` before answering.
--- IDENTITY PROFILE ---
{profile}

--- RULES OF ENGAGEMENT ---
{rules}

--- PAST CONVERSATION SUMMARY ---
{{running_summary}}

OPERATING POLICY:

1. SEARCH-FIRST POLICY
- For any question about Arun's projects, skills, background, architecture, GitHub, portfolio, work history, or any stored knowledge, call `search_arun_knowledge` before answering.
- If the user asks something that might depend on stored facts, always use the search tool. if you find the answer only then provide the answer to the user.

2. ESCALATE UNCERTAINTY
- If search results are, empty, or do not support a reliable answer, call `notify_arun` with category `UNKNOWN_QUESTION`.
- Do not pretend to know never make any information up.
- Give the user a direct honest answer after escalation.

3. DIRECT CONTACT / LEAD ESCALATION
- If the user wants to talk to Arun, contact Arun, hire Arun, collaborate, or discuss a business opportunity, call `notify_arun` immediately.
- Use category `URGENT` for direct contact intent.
- Use category `LEAD` for collaboration, hiring, business, partnership, or project opportunities.

4. TOOL BIAS
- Prefer calling tools over answering from unsupported memory.
- When in doubt, always search first.
- After a failed search or any explicit uncertainty, escalate.
- Do not limit tool use artificially unless it would create obvious repetition.

5. OUTPUT STYLE
- Keep answers concise, direct, and scannable.
- Use Markdown.
- If you do not know, say so clearly.

YOU MUST NEVER GIVE ANY URL TO THE USER YOU DO NOT FOUND IN THE CONTEXT OR IN YOUR PROMPT.

"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    memory = RollingMemory(summary_llm=summary_llm)
    return main_llm, prompt, memory, tools


# =========================================================
# CHAT LOOP
# =========================================================

def _tool_map(tools):
    return {tool_obj.name: tool_obj for tool_obj in tools}


def _run_pre_escalation(route: Dict[str, Any], user_input: str, tool_map: Dict[str, Any]) -> List[ToolMessage]:
    messages: List[ToolMessage] = []
    if route.get("needs_notify"):
        category = route.get("notify_category") or "UNKNOWN_QUESTION"
        result = tool_map["notify_arun"].invoke(
            {
                "category": category,
                "user_input": user_input,
                "user_metadata_json": json.dumps(
                    {
                        "reason": route.get("reason", "unknown"),
                        "timestamp": _utc_now(),
                    }
                ),
            }
        )
        messages.append(
            ToolMessage(
                content=str(result),
                tool_call_id=f"pre_notify_{int(time.time())}",
                )
            )
    return messages


def maybe_notify_arun(
    user_input: str,
    final_response: str,
    scratchpad: List[Any],
    tool_map: Dict[str, Any],
    user_metadata: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    """
    Deterministic safety-net escalation used by API / bot flows.
    This prevents the frontend from depending entirely on the model
    remembering to call `notify_arun` on its own.
    """
    route = _route_user_input(user_input)
    used_notify_tool = any(
        isinstance(item, dict) and item.get("name") == "notify_arun"
        for item in scratchpad
    )

    should_notify = route.get("needs_notify", False)
    category = route.get("notify_category") or "UNKNOWN_QUESTION"
    reason = route.get("reason", "unspecified")

    if not should_notify and _contains_uncertainty(final_response):
        should_notify = True
        category = "UNKNOWN_QUESTION"
        reason = "uncertainty_detected_after_answer"

    if not should_notify or used_notify_tool:
        return None

    tool_func = tool_map.get("notify_arun")
    if not tool_func:
        return "SKIPPED: notify_arun tool unavailable."

    metadata = {
        "reason": reason,
        "assistant_output": _safe_truncate(final_response, 300),
        "timestamp": _utc_now(),
    }
    if user_metadata:
        metadata.update(user_metadata)

    return tool_func.invoke(
        {
            "category": category,
            "user_input": user_input,
            "user_metadata_json": json.dumps(metadata),
        }
    )


def chat_interface():
    print("\n" + "=" * 60)
    print("ArunCore stateful agent")
    print("Type 'exit' to quit.")
    print("=" * 60 + "\n")

    try:
        main_llm, prompt, memory, tools = init_agent()
    except Exception as e:
        print(f"Startup Error: {e}")
        return

    tool_map = _tool_map(tools)

    while True:
        try:
            user_input = input("You: ").strip()
            if user_input.lower() in {"exit", "quit"}:
                break
            if not user_input:
                continue

            route = _route_user_input(user_input)
            scratchpad: List[Any] = []
            scratchpad.extend(_run_pre_escalation(route, user_input, tool_map))

            final_response: Optional[str] = None
            used_tools = set()

            for _ in range(MAX_TOOL_ROUNDS):
                messages = prompt.format_messages(
                    running_summary=memory.running_summary,
                    chat_history=memory.get_messages(),
                    input=user_input,
                    agent_scratchpad=scratchpad,
                )

                ai_msg = main_llm.invoke(messages)

                if ai_msg.tool_calls:
                    scratchpad.append(ai_msg)
                    for tc in ai_msg.tool_calls:
                        tool_name = tc.get("name")
                        used_tools.add(tool_name)
                        print(f"[SYSTEM] Tool call: {tool_name}({tc.get('args')})")

                        tool_func = tool_map.get(tool_name)
                        if not tool_func:
                            tool_result = f"ERROR: Unknown tool '{tool_name}'."
                        else:
                            try:
                                tool_result = tool_func.invoke(tc.get("args", {}))
                            except Exception as e:
                                tool_result = f"Error executing tool: {e}"

                        scratchpad.append(
                            ToolMessage(
                                content=_safe_truncate(str(tool_result), 3000),
                                tool_call_id=tc.get("id", f"tool_{int(time.time() * 1000)}"),
                            )
                        )
                    continue

                final_response = (ai_msg.content or "").strip()
                break

            if not final_response:
                final_response = "I do not have enough information to answer that."

            # Safety net: if the model sounds uncertain and did not notify Arun, escalate.
            if _contains_uncertainty(final_response) and "notify_arun" not in used_tools:
                try:
                    notify_result = tool_map["notify_arun"].invoke(
                        {
                            "category": "UNKNOWN_QUESTION",
                            "user_input": user_input,
                            "user_metadata_json": json.dumps(
                                {
                                    "reason": "uncertainty_detected_after_answer",
                                    "assistant_output": _safe_truncate(final_response, 300),
                                    "timestamp": _utc_now(),
                                }
                            ),
                        }
                    )
                    print(f"[SYSTEM] {notify_result}")
                except Exception as e:
                    print(f"[SYSTEM] Failed to auto-notify Arun: {e}")

            print(f"\nArunCore: {final_response}\n")
            print("-" * 60)

            memory.add_interaction(user_input, final_response)

        except Exception as e:
            print(f"Agent Loop Error: {e}")


if __name__ == "__main__":
    chat_interface()
