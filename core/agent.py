import os
import json
import requests
import uuid
from typing import List, Dict, Any, Tuple
from pathlib import Path
from dotenv import load_dotenv

# Langchain core & tools
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain_openai import OpenAIEmbeddings
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# DB & Retrievers
from langchain_community.vectorstores import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain_cohere import CohereRerank

# System configuration
load_dotenv()
if os.getenv("COHERE_API_KEY"):
    os.environ["CO_API_KEY"] = os.getenv("COHERE_API_KEY")

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "db"
STATIC_DIR = BASE_DIR / "data" / "static"

# ==========================================
# GLOBAL STATE (Singletons for Tool Access)
# ==========================================
# Tools in LangChain must be pure functions, so we need a way to reference the database globally or inject it.
# We will use global references instantiated during `init_agent()`.
_GLOBAL_VECTORSTORE = None
_GLOBAL_BM25 = None
_GLOBAL_COMPRESSOR = None

# ==========================================
# TOOLS
# ==========================================

@tool
def notify_arun(category: str, user_input: str) -> str:
    """
    Sends a real-time Telegram notification to the real Arun.
    Used for Lead Capture, Direct Contact requests, or Unknown questions.
    Args:
        category: Choose from 'LEAD', 'URGENT', or 'UNKNOWN_QUESTION'
        user_input: The user's message or contact details.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    
    if not token or not chat_id:
        return "Notification failed: Telegram credentials not configured in environment."

    text = f"🚨 *ArunCore Alert* 🚨\n\n*Category:* {category}\n*Details:* {user_input}"
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    
    try:
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            return "SUCCESS: Arun has been notified and will receive this alert on his phone."
        else:
            return f"FAILED: Telegram API returned {response.status_code}"
    except Exception as e:
        return f"ERROR: Could not send notification. {str(e)}"

@tool
def search_arun_knowledge(search_query: str) -> str:
    """
    Searches Arun's database for technical details, background, projects, and architecture.
    You MUST prioritize using this tool before answering questions about Arun's history or work.
    If the response says "No results found", inform the user you do not know.
    
    Args:
        search_query: A highly descriptive, standalone search query focusing on key technical terms.
    """
    global _GLOBAL_VECTORSTORE, _GLOBAL_BM25, _GLOBAL_COMPRESSOR
    
    if not _GLOBAL_VECTORSTORE or not _GLOBAL_BM25 or not _GLOBAL_COMPRESSOR:
        return "ERROR: Database retrievers are not initialized."

    # Stage 1: Hybrid Retrieval 
    vec_docs = _GLOBAL_VECTORSTORE.similarity_search(search_query, k=15)
    lex_docs = _GLOBAL_BM25.invoke(search_query)
    
    doc_id_map = {}
    combined = []
    for d in vec_docs:
        cid = d.metadata.get('chunk_id', d.page_content[:50])
        if cid not in doc_id_map:
            doc_id_map[cid] = True
            combined.append(d)
    for d in lex_docs:
        cid = d.metadata.get('chunk_id', d.page_content[:50])
        if cid not in doc_id_map:
            doc_id_map[cid] = True
            combined.append(d)
    
    initial_docs = combined[:20]

    # Stage 2: Reranking
    if initial_docs:
        reranked_docs = _GLOBAL_COMPRESSOR.compress_documents(documents=initial_docs, query=search_query)
    else:
        reranked_docs = []

    if not reranked_docs:
        return "DATABASE SEARCH RESULT: No relevant data found for this query."
        
    context_str = "\n\n---\n\n".join([f"[Source: {doc.metadata.get('source')}]\n{doc.page_content}" for doc in reranked_docs])
    return f"DATABASE SEARCH RESULT:\n\n{context_str}"


# ==========================================
# MEMORY MANAGER
# ==========================================

class RollingMemory:
    def __init__(self, summary_llm, max_turns: int = 4):
        self.summary_llm = summary_llm
        self.max_turns = max_turns
        self.history: List[Any] = []  # Stores Raw Langchain Message Objects
        self.running_summary: str = "No prior summary. This is the start of the conversation."
        self.invocation_count = 0

    def add_interaction(self, human_text: str, ai_text: str):
        self.history.append(HumanMessage(content=human_text))
        self.history.append(AIMessage(content=ai_text))
        self.invocation_count += 1

        # Check if we need to summarize (every `max_turns` interactions)
        if self.invocation_count >= self.max_turns:
            self._summarize_and_prune()

    def _summarize_and_prune(self):
        print("\n[SYSTEM] Triggering Background Summarization...")
        # We summarize everything except the very last 2 interactions (4 messages) to maintain immediate flow
        messages_to_summarize = self.history[:-4]
        
        if not messages_to_summarize:
            return

        chat_transcript = "\n".join([f"{'User' if isinstance(m, HumanMessage) else 'ArunCore'}: {m.content}" for m in messages_to_summarize])
        
        prompt = (
            "You are an internal memory compression engine for ArunCore.\n"
            "Below is the existing summary of the conversation, followed by the latest messages.\n"
            "Produce a NEW, concise running summary merging both. Preserve all technical context, names, project mentions, and user facts. Keep it under 5 sentences.\n\n"
            f"--- EXISTING SUMMARY ---\n{self.running_summary}\n\n"
            f"--- NEW CHAT TO MERGE ---\n{chat_transcript}"
        )
        
        try:
            res = self.summary_llm.invoke(prompt)
            self.running_summary = res.content
            print(f"[SYSTEM] Memory Compressed. New Summary: {self.running_summary[:100]}...\n")
            
            # Prune the history to just the recent immediate context
            self.history = self.history[-4:]
            self.invocation_count = len(self.history) // 2
        except Exception as e:
            print(f"[SYSTEM ERROR] Failed to summarize memory: {e}")

    def get_messages(self):
        return self.history

# ==========================================
# AGENT SETUP
# ==========================================

def load_static_context():
    profile_path = STATIC_DIR / "public_profile.md"
    rules_path = STATIC_DIR / "rules_of_engagement.md"
    
    with open(profile_path, "r", encoding="utf-8") as f:
        profile = f.read()
    with open(rules_path, "r", encoding="utf-8") as f:
        rules = f.read()
        
    return profile, rules

def init_agent():
    global _GLOBAL_VECTORSTORE, _GLOBAL_BM25, _GLOBAL_COMPRESSOR
    
    if not os.getenv("OPENAI_API_KEY") or not os.getenv("GROQ_API_KEY") or not os.getenv("COHERE_API_KEY"):
        raise ValueError("Missing API Keys.")

    # Init DBs (Global binding for tools)
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.getenv("OPENAI_API_KEY"))
    import warnings; warnings.filterwarnings("ignore", category=DeprecationWarning)
    
    # Use standard Chroma safely for now to avoid refactoring issues while changing architectures.
    _GLOBAL_VECTORSTORE = Chroma(
        collection_name="aruncore_knowledge",
        embedding_function=embeddings,
        persist_directory=str(DB_DIR)
    )
    
    all_data = _GLOBAL_VECTORSTORE.get()
    documents = [
        Document(page_content=text, metadata=metadata) 
        for text, metadata in zip(all_data['documents'], all_data['metadatas'])
    ]
    if not documents: raise ValueError("Vector database is empty. Run 'python core/ingest.py' first.")
        
    _GLOBAL_BM25 = BM25Retriever.from_documents(documents)
    _GLOBAL_BM25.k = 10
    
    _GLOBAL_COMPRESSOR = CohereRerank(top_n=5, model="rerank-english-v3.0", cohere_api_key=os.getenv("COHERE_API_KEY"))

    # Init LLMs
    # 1. Fast LLM for Summarization
    summary_llm = ChatGroq(temperature=0.0, model_name="llama-3.1-8b-instant", api_key=os.getenv("GROQ_API_KEY"))
    
    # 2. Heavy LLM for Tool Calling & Generation
    tools = [notify_arun, search_arun_knowledge]
    main_llm = ChatGroq(
        temperature=0.2, 
        model_name="openai/gpt-oss-120b", 
        api_key=os.getenv("GROQ_API_KEY")
    ).bind_tools(tools)

    # Build Stateful Prompt
    profile, rules = load_static_context()
    
    system_prompt = (
        "You are ArunCore, the AI digital twin of Arun Yadav.\n"
        "You speak in the first person ('I', 'My') representing Arun.\n\n"
        
        "--- IDENTITY PROFILE ---\n"
        f"{profile}\n\n"
        
        "--- RULES OF ENGAGEMENT ---\n"
        f"{rules}\n\n"
        
        "--- CONVERSATION SUMMARY (PAST CONTEXT) ---\n"
        "This is a running summary of your conversation with the user so far:\n"
        "{running_summary}\n\n"
        
        "IMPORTANT LLM INSTRUCTION (TOOL CALLING):\n"
        "You have access to tools (search_arun_knowledge, notify_arun). \n"
        "ALWAYS use `search_arun_knowledge` before answering technical queries. \n"
        "NEVER generate raw XML or text tags like `<function=notify_arun...>` in your response. "
        "You MUST use the native API JSON format to invoke tools silently."
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    # Init Memory
    memory = RollingMemory(summary_llm=summary_llm)

    return main_llm, prompt, memory, tools

def chat_interface():
    print("\n" + "="*50)
    print("Welcome to ArunCore Stateful Architecture.")
    print("Type 'exit' to quit. The agent has tools and rolling memory.")
    print("="*50 + "\n")
    
    try:
        main_llm, prompt, memory, tools = init_agent()
    except Exception as e:
        print(f"Startup Error: {e}")
        return

    # Map tools for easy execution
    tool_map = {t.name: t for t in tools}

    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            
            # The agent scratchpad holds intermediate steps (Tool Calls & Answers) within the current turn
            scratchpad = []
            final_response = None
            max_iterations = 3
            iterations = 0

            # Execute Agent Loop (Will keep looping until LLM stops calling tools)
            while iterations < max_iterations:
                messages = prompt.format_messages(
                    running_summary=memory.running_summary,
                    chat_history=memory.get_messages(),
                    input=user_input,
                    agent_scratchpad=scratchpad
                )
                
                ai_msg = main_llm.invoke(messages)
                
                if ai_msg.tool_calls:
                    scratchpad.append(ai_msg)
                    for tc in ai_msg.tool_calls:
                        print(f"[SYSTEM] Agent requested tool: {tc['name']}({tc['args']})")
                        tool_func = tool_map.get(tc['name'])
                        
                        try:
                            # Execute tool
                            tool_result = tool_func.invoke(tc['args'])
                        except Exception as e:
                            tool_result = f"Error executing tool: {e}"
                        
                        # Tell the AI what happened
                        scratchpad.append({
                            "role": "tool",
                            "name": tc['name'],
                            "tool_call_id": tc['id'],
                            "content": str(tool_result)[:2000] # Cap output length just in case
                        })
                    iterations += 1
                else:
                    # No more tool calls; AI provided final text answer
                    final_response = ai_msg.content
                    break
            
            if not final_response:
                final_response = "[SYSTEM] Agent iteration limit reached."
                
            print(f"\nArunCore: {final_response}\n")
            print("-"*50)
            
            # Commit to memory
            memory.add_interaction(user_input, final_response)
            
        except Exception as e:
            print(f"Agent Loop Error: {e}")

if __name__ == "__main__":
    chat_interface()
