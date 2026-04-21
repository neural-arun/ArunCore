from concurrent.futures import ThreadPoolExecutor
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
TELEGRAM_MESSAGE_CHAR_LIMIT = 3500

# =========================================================
# GLOBAL STATE
# =========================================================

_GLOBAL_VECTORSTORE = None
_GLOBAL_BM25 = None
_GLOBAL_COMPRESSOR = None
_BACKGROUND_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="aruncore-bg")

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


def _is_truthy_env(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _telegram_debug_enabled() -> bool:
    return _is_truthy_env(os.getenv("TELEGRAM_DEBUG_ENABLED"), default=True)


def _get_telegram_target(debug: bool = False) -> Tuple[Optional[str], Optional[str]]:
    if debug:
        token = os.getenv("TELEGRAM_DEBUG_BOT_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = os.getenv("TELEGRAM_DEBUG_CHAT_ID") or os.getenv("TELEGRAM_CHAT_ID")
        return token, chat_id

    return os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")


def _chunk_text(text: str, limit: int = 2200) -> List[str]:
    cleaned = (text or "").strip() or "(empty)"
    parts: List[str] = []
    remaining = cleaned

    while len(remaining) > limit:
        split_at = remaining.rfind("\n", 0, limit)
        if split_at < int(limit * 0.5):
            split_at = remaining.rfind(" ", 0, limit)
        if split_at <= 0:
            split_at = limit

        parts.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].lstrip()

    if remaining:
        parts.append(remaining)

    return parts or ["(empty)"]


def _send_telegram_message(
    token: str,
    chat_id: str,
    text: str,
    parse_mode: str = "HTML",
) -> str:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }

    last_error = "Unknown Telegram error."
    for attempt in range(3):
        try:
            response = requests.post(url, json=payload, timeout=4)
            if response.status_code == 200:
                return "SUCCESS"

            last_error = f"Telegram API returned {response.status_code} - {response.text[:300]}"
        except requests.exceptions.Timeout:
            last_error = "Telegram request timed out."
        except requests.exceptions.RequestException as e:
            last_error = f"Could not send notification. {str(e)}"

        if attempt < 2:
            time.sleep(0.8 * (attempt + 1))

    return f"FAILED: {last_error}"


def send_debug_event(
    event_type: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
    if not _telegram_debug_enabled():
        return "SKIPPED: debug stream disabled."

    token, chat_id = _get_telegram_target(debug=True)
    if not token or not chat_id:
        return "SKIPPED: Telegram debug credentials are missing."

    header_lines = [
        "<b>ArunCore Debug</b>",
        f"<b>Type:</b> {_escape_html(event_type)}",
        f"<b>Time:</b> {_escape_html(_utc_now())}",
    ]

    metadata = metadata or {}
    for key, value in metadata.items():
        if value is None:
            continue
        header_lines.append(f"<b>{_escape_html(str(key))}:</b> {_escape_html(str(value))}")

    content_chunks = _chunk_text(content, limit=2200)

    for index, chunk in enumerate(content_chunks, start=1):
        lines = list(header_lines)
        if len(content_chunks) > 1:
            lines.append(f"<b>Part:</b> {index}/{len(content_chunks)}")
        lines.extend(["", "<b>Content</b>", _escape_html(chunk)])

        result = _send_telegram_message(
            token=token,
            chat_id=chat_id,
            text="\n".join(lines)[:TELEGRAM_MESSAGE_CHAR_LIMIT],
        )
        if not result.startswith("SUCCESS"):
            return result

    return "SUCCESS: debug event sent."


def _run_background_task(task_name: str, func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as e:
        print(f"[BACKGROUND ERROR] {task_name}: {e}")
        return None


def _submit_background_task(task_name: str, func, *args, **kwargs) -> bool:
    try:
        _BACKGROUND_EXECUTOR.submit(_run_background_task, task_name, func, *args, **kwargs)
        return True
    except RuntimeError as e:
        print(f"[BACKGROUND ERROR] Failed to submit {task_name}: {e}")
        return False


def queue_debug_event(
    event_type: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
    if not _telegram_debug_enabled():
        return "SKIPPED: debug stream disabled."

    if _submit_background_task("debug_event", send_debug_event, event_type, content, metadata):
        return "QUEUED: debug event scheduled."

    return "FAILED: could not queue debug event."


def _build_notification_metadata(
    reason: str,
    user_metadata: Optional[Dict[str, Any]] = None,
    assistant_output: Optional[str] = None,
) -> Dict[str, Any]:
    metadata: Dict[str, Any] = {
        "reason": reason,
        "timestamp": _utc_now(),
    }
    if assistant_output:
        metadata["assistant_output"] = _safe_truncate(assistant_output, 300)
    if user_metadata:
        metadata.update(user_metadata)
    return metadata


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

    direct_contact_patterns = [
        r"\btalk to arun\b",
        r"\bconnect me to arun\b",
        r"\bcontact arun\b",
        r"\bmessage arun\b",
        r"\bnotify arun\b",
        r"\bsend (?:a )?notification to arun\b",
        r"\btell arun\b",
        r"\blet arun know\b",
        r"\bping arun\b",
    ]

    lead_patterns = [
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

    notify_words_present = any(word in lower for word in ["notify", "notification", "ping"])
    notify_target_present = any(word in lower for word in ["arun", "you", "twin"])

    if any(re.search(pattern, lower) for pattern in direct_contact_patterns) or (
        notify_words_present and notify_target_present
    ):
        return {
            "needs_search": False,
            "needs_notify": True,
            "notify_category": "URGENT",
            "reason": "explicit_contact_or_notification_intent",
        }

    if any(re.search(pattern, lower) for pattern in lead_patterns):
        return {
            "needs_search": False,
            "needs_notify": True,
            "notify_category": "LEAD",
            "reason": "business_or_lead_intent",
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
    token, chat_id = _get_telegram_target(debug=False)

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

    result = _send_telegram_message(
        token=token,
        chat_id=chat_id,
        text=text,
    )
    if result.startswith("SUCCESS"):
        return "SUCCESS: Arun has been notified."
    return result


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
MUST REMEMBER: THAT YOU CAN ONLY GIVE THE URL YOU FOUND IN THE
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

.

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


def _build_notify_payload(
    category: str,
    user_input: str,
    reason: str,
    user_metadata: Optional[Dict[str, Any]] = None,
    assistant_output: Optional[str] = None,
) -> Dict[str, str]:
    metadata = _build_notification_metadata(
        reason=reason,
        user_metadata=user_metadata,
        assistant_output=assistant_output,
    )
    return {
        "category": category,
        "user_input": user_input,
        "user_metadata_json": json.dumps(metadata),
    }


def _tool_was_used(scratchpad: List[Any], tool_name: str) -> bool:
    for item in scratchpad:
        if isinstance(item, dict) and item.get("name") == tool_name:
            return True

        if isinstance(item, AIMessage):
            for tool_call in item.tool_calls or []:
                if tool_call.get("name") == tool_name:
                    return True

    return False


def _run_pre_escalation(
    route: Dict[str, Any],
    user_input: str,
    tool_map: Dict[str, Any],
    user_metadata: Optional[Dict[str, Any]] = None,
    background: bool = False,
) -> Optional[Dict[str, Any]]:
    if not route.get("needs_notify"):
        return None

    category = route.get("notify_category") or "UNKNOWN_QUESTION"
    reason = route.get("reason", "unknown")
    payload = _build_notify_payload(
        category=category,
        user_input=user_input,
        reason=reason,
        user_metadata=user_metadata,
    )
    tool_func = tool_map.get("notify_arun")
    if not tool_func:
        return {
            "handled": False,
            "category": category,
            "reason": reason,
            "result": "SKIPPED: notify_arun tool unavailable.",
        }

    if background:
        submitted = _submit_background_task("pre_escalation_notify", tool_func.invoke, payload)
        return {
            "handled": submitted,
            "category": category,
            "reason": reason,
            "result": "QUEUED: pre-escalation notification scheduled." if submitted else "FAILED: could not queue pre-escalation notification.",
        }

    result = str(tool_func.invoke(payload))
    return {
        "handled": result.startswith("SUCCESS") or result.startswith("SKIPPED"),
        "category": category,
        "reason": reason,
        "result": result,
    }


def run_pre_escalation(
    user_input: str,
    tool_map: Dict[str, Any],
    user_metadata: Optional[Dict[str, Any]] = None,
    background: bool = False,
) -> Optional[Dict[str, Any]]:
    route = _route_user_input(user_input)
    return _run_pre_escalation(
        route,
        user_input,
        tool_map,
        user_metadata=user_metadata,
        background=background,
    )


def maybe_notify_arun(
    user_input: str,
    final_response: str,
    scratchpad: List[Any],
    tool_map: Dict[str, Any],
    user_metadata: Optional[Dict[str, Any]] = None,
    pre_notified: bool = False,
) -> Optional[str]:
    """
    Deterministic safety-net escalation used by API / bot flows.
    This prevents the frontend from depending entirely on the model
    remembering to call `notify_arun` on its own.
    """
    route = _route_user_input(user_input)
    used_notify_tool = pre_notified or _tool_was_used(scratchpad, "notify_arun")

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

    payload = _build_notify_payload(
        category=category,
        user_input=user_input,
        reason=reason,
        user_metadata=user_metadata,
        assistant_output=final_response,
    )

    return tool_func.invoke(payload)


def queue_maybe_notify_arun(
    user_input: str,
    final_response: str,
    scratchpad: List[Any],
    tool_map: Dict[str, Any],
    user_metadata: Optional[Dict[str, Any]] = None,
    pre_notified: bool = False,
) -> str:
    def _background_notify():
        result = maybe_notify_arun(
            user_input=user_input,
            final_response=final_response,
            scratchpad=scratchpad,
            tool_map=tool_map,
            user_metadata=user_metadata,
            pre_notified=pre_notified,
        )
        if result:
            send_debug_event("auto_escalation", str(result), user_metadata)
        return result

    submitted = _submit_background_task(
        "maybe_notify_arun",
        _background_notify,
    )
    if submitted:
        return "QUEUED: maybe_notify_arun scheduled."
    return "FAILED: could not queue maybe_notify_arun."


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
            pre_escalation = _run_pre_escalation(route, user_input, tool_map, background=True)
            if pre_escalation:
                print(f"[SYSTEM] {pre_escalation['result']}")

            final_response: Optional[str] = None

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

            notify_result = maybe_notify_arun(
                user_input=user_input,
                final_response=final_response,
                scratchpad=scratchpad,
                tool_map=tool_map,
                pre_notified=bool(pre_escalation and pre_escalation.get("handled")),
            )
            if notify_result:
                print(f"[SYSTEM] {notify_result}")

            print(f"\nArunCore: {final_response}\n")
            print("-" * 60)

            memory.add_interaction(user_input, final_response)

        except Exception as e:
            print(f"Agent Loop Error: {e}")


if __name__ == "__main__":
    chat_interface()
