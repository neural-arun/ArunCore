import os
import json
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict
from dotenv import load_dotenv

# Import the core engine components
from core.agent import init_agent, RollingMemory, queue_debug_event, queue_maybe_notify_arun, run_pre_escalation, queue_chat_history_to_telegram
from langchain_openai import ChatOpenAI

load_dotenv()

# Initialize the ArunCore Engine
try:
    print("Initializing ArunCore API Backend...")
    main_llm, prompt, default_memory, tools = init_agent()

    # We create a tool map to easily execute tools by name
    global_tool_map = {t.name: t for t in tools}

    print("API Backend Initialized Successfully.")
except Exception as e:
    print(f"Failed to initialize backend: {e}")
    raise e

app = FastAPI(title="ArunCore API", description="Stateful Agentic Backend for Arun Yadav's Digital Twin.")

# Enable CORS for external frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === SESSION MANAGEMENT ===
active_sessions: Dict[str, RollingMemory] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if req.session_id not in active_sessions:
        summary_llm = ChatOpenAI(temperature=0.0, model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
        active_sessions[req.session_id] = RollingMemory(summary_llm=summary_llm)

    memory = active_sessions[req.session_id]

    async def event_generator():
        scratchpad = []
        thoughts = []
        max_iterations = 8
        iterations = 0
        search_count = 0
        max_search_limit = 3
        final_response = None

        try:
            yield json.dumps({"type": "status", "content": "Analyzing your request..."}) + "\n"

            queue_debug_event(
                "user_message",
                req.message,
                {"channel": "api", "session_id": req.session_id},
            )

            pre_escalation = await asyncio.to_thread(
                run_pre_escalation,
                req.message,
                global_tool_map,
                {"channel": "api", "session_id": req.session_id},
                True,
            )
            if pre_escalation:
                pre_escalation_result = pre_escalation.get("result", "")
                if pre_escalation_result.startswith("SUCCESS"):
                    pre_escalation_status = "Notification sent to Arun."
                elif pre_escalation_result.startswith("SKIPPED"):
                    pre_escalation_status = "Notification was already sent recently."
                elif "Retry queued in background" in pre_escalation_result:
                    pre_escalation_status = "Notification was not confirmed immediately. Retrying in background."
                elif "QUEUED" in pre_escalation_result:
                    pre_escalation_status = "Sending notification to Arun in the background."
                elif "credentials are missing" in pre_escalation_result:
                    pre_escalation_status = "Error: Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in HuggingFace Spaces Settings!"
                else:
                    pre_escalation_status = "Notification could not be confirmed."

                yield json.dumps({"type": "status", "content": pre_escalation_status}) + "\n"
                thoughts.append(pre_escalation_status)
                queue_debug_event(
                    "pre_escalation",
                    pre_escalation_result,
                    {
                        "channel": "api",
                        "session_id": req.session_id,
                        "category": pre_escalation.get("category"),
                        "reason": pre_escalation.get("reason"),
                    },
                )

            while iterations < max_iterations:
                messages = prompt.format_messages(
                    running_summary=memory.running_summary,
                    chat_history=memory.get_messages(),
                    input=req.message,
                    agent_scratchpad=scratchpad,
                )

                ai_msg = await asyncio.to_thread(main_llm.invoke, messages)

                if ai_msg.tool_calls:
                    scratchpad.append(ai_msg)
                    for tc in ai_msg.tool_calls:
                        tool_name = tc["name"]
                        tool_args = tc.get("args", {})

                        status_msg = "Searching Arun's knowledge..." if tool_name == "search_arun_knowledge" else \
                                     "Sending notification to Arun..." if tool_name == "notify_arun" else \
                                     f"Running {tool_name}..."

                        yield json.dumps({"type": "status", "content": status_msg}) + "\n"
                        thoughts.append(status_msg)
                        queue_debug_event(
                            "tool_call",
                            json.dumps(tool_args, ensure_ascii=False, indent=2, default=str),
                            {
                                "channel": "api",
                                "session_id": req.session_id,
                                "tool_name": tool_name,
                            },
                        )

                        if tool_name == "search_arun_knowledge":
                            search_count += 1

                        if search_count > max_search_limit:
                            tool_result = f"Search limit reached ({max_search_limit}). Finalizing based on existing context."
                        else:
                            tool_func = global_tool_map.get(tool_name)
                            tool_result = await asyncio.to_thread(tool_func.invoke, tool_args)

                        scratchpad.append({
                            "role": "tool",
                            "name": tool_name,
                            "tool_call_id": tc["id"],
                            "content": str(tool_result)[:2000],
                        })
                        queue_debug_event(
                            "tool_result",
                            str(tool_result),
                            {
                                "channel": "api",
                                "session_id": req.session_id,
                                "tool_name": tool_name,
                            },
                        )
                    iterations += 1
                else:
                    final_response = ai_msg.content
                    break

            if not final_response:
                final_response = "I encountered a processing limit. How else can I help?"

            queue_debug_event(
                "assistant_reply",
                final_response,
                {"channel": "api", "session_id": req.session_id},
            )

            queue_maybe_notify_arun(
                user_input=req.message,
                final_response=final_response,
                scratchpad=scratchpad,
                tool_map=global_tool_map,
                user_metadata={"channel": "api", "session_id": req.session_id},
                pre_notified=bool(pre_escalation and pre_escalation.get("handled")),
            )

            memory.add_interaction(req.message, final_response)
            queue_chat_history_to_telegram(req.session_id, req.message, final_response)

            yield json.dumps({
                "type": "final",
                "reply": final_response,
                "thoughts": thoughts,
                "session_id": req.session_id,
            }) + "\n"

        except Exception as e:
            queue_debug_event(
                "error",
                str(e),
                {"channel": "api", "session_id": req.session_id},
            )
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")



    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


@app.get("/health")
async def health_check():
    return {"status": "online", "active_sessions": len(active_sessions)}


@app.get("/test-telegram")
def test_telegram():
    import os, urllib.request, json, traceback, ssl
    
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return {"status": "error", "message": "Missing credentials", "has_token": bool(token), "has_chat_id": bool(chat_id)}
    
    token = token.strip(' "\'')
    chat_id = chat_id.strip(' "\'')
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": "Test message from HuggingFace backend using urllib!"}
    
    data = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json', 'User-Agent': 'ArunCore/1.0'}
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
            resp_text = response.read().decode('utf-8')
            return {"status": "finished", "status_code": response.status, "response": resp_text}
    except Exception as e:
        return {"status": "exception", "error": str(e), "traceback": traceback.format_exc()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("core.api:app", host="0.0.0.0", port=8000, reload=True)
