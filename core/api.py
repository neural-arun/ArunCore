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
from core.agent import init_agent, RollingMemory, maybe_notify_arun
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
            while iterations < max_iterations:
                if iterations == 0:
                    yield json.dumps({"type": "status", "content": "Analyzing your request..."}) + "\n"

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

                        status_msg = "Searching Arun's knowledge..." if tool_name == "search_arun_knowledge" else \
                                     "Sending notification to Arun..." if tool_name == "notify_arun" else \
                                     f"Running {tool_name}..."

                        yield json.dumps({"type": "status", "content": status_msg}) + "\n"
                        thoughts.append(status_msg)

                        if tool_name == "search_arun_knowledge":
                            search_count += 1

                        if search_count > max_search_limit:
                            tool_result = f"Search limit reached ({max_search_limit}). Finalizing based on existing context."
                        else:
                            tool_func = global_tool_map.get(tool_name)
                            tool_result = await asyncio.to_thread(tool_func.invoke, tc["args"])

                        scratchpad.append({
                            "role": "tool",
                            "name": tool_name,
                            "tool_call_id": tc["id"],
                            "content": str(tool_result)[:2000],
                        })
                    iterations += 1
                else:
                    final_response = ai_msg.content
                    break

            if not final_response:
                final_response = "I encountered a processing limit. How else can I help?"

            escalation_result = await asyncio.to_thread(
                maybe_notify_arun,
                req.message,
                final_response,
                scratchpad,
                global_tool_map,
                {"channel": "api", "session_id": req.session_id},
            )
            if escalation_result:
                thoughts.append(f"Auto-escalation triggered: {escalation_result.get('category', 'UNKNOWN')}")

            memory.add_interaction(req.message, final_response)

            yield json.dumps({
                "type": "final",
                "reply": final_response,
                "thoughts": thoughts,
                "session_id": req.session_id,
            }) + "\n"

        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


@app.get("/health")
async def health_check():
    return {"status": "online", "active_sessions": len(active_sessions)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("core.api:app", host="0.0.0.0", port=8000, reload=True)
