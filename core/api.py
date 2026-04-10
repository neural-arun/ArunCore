import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from dotenv import load_dotenv

# Import the core engine components
from core.agent import init_agent, RollingMemory
from langchain_groq import ChatGroq

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

# Enable CORS for external frontends (like Next.js on Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === SESSION MANAGEMENT ===
# In-memory store mapping session_id -> RollingMemory
active_sessions: Dict[str, RollingMemory] = {}

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    session_id: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    # Get or create the unique memory buffer for this user
    if req.session_id not in active_sessions:
        print(f"[API] Creating new memory session for {req.session_id}")
        # Initialize the fast underlying summarizer
        summary_llm = ChatGroq(temperature=0.0, model_name="llama-3.1-8b-instant", api_key=os.getenv("GROQ_API_KEY"))
        active_sessions[req.session_id] = RollingMemory(summary_llm=summary_llm)
        
    memory = active_sessions[req.session_id]
    
    scratchpad = []
    final_response = None
    max_iterations = 8
    iterations = 0

    search_count = 0
    max_search_limit = 3

    # Executes the Agent-Tool Loop
    while iterations < max_iterations:
        messages = prompt.format_messages(
            running_summary=memory.running_summary,
            chat_history=memory.get_messages(),
            input=req.message,
            agent_scratchpad=scratchpad
        )
        
        try:
            ai_msg = main_llm.invoke(messages)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM Generation Error: {str(e)}")
        
        if ai_msg.tool_calls:
            scratchpad.append(ai_msg)
            for tc in ai_msg.tool_calls:
                tool_name = tc['name']
                print(f"[API] Session {req.session_id} requested tool: {tool_name}")
                
                # Check for search budget
                if tool_name == "search_arun_knowledge":
                    search_count += 1
                
                if search_count > max_search_limit:
                    tool_result = f"SYSTEM WARNING: Search limit of {max_search_limit} reached for this specific message. DO NOT SEARCH AGAIN. You must now provide a final response based on the search results you already have above."
                    print(f"[API] Search limit triggered for {req.session_id}")
                else:
                    tool_func = global_tool_map.get(tool_name)
                    try:
                        tool_result = tool_func.invoke(tc['args'])
                    except Exception as e:
                        tool_result = f"Error executing tool: {e}"
                
                # Report back to the LLM
                scratchpad.append({
                    "role": "tool",
                    "name": tool_name,
                    "tool_call_id": tc['id'],
                    "content": str(tool_result)[:2000]
                })
            iterations += 1
        else:
            # Reached a final text response
            final_response = ai_msg.content
            break
    
    if not final_response:
        final_response = "[SYSTEM] I'm sorry, I encountered an internal loop threshold. Let's try chatting again."
        
    # Commit interaction to the specific user's memory
    memory.add_interaction(req.message, final_response)
    
    return ChatResponse(reply=final_response, session_id=req.session_id)

@app.get("/health")
async def health_check():
    return {"status": "online", "active_sessions": len(active_sessions)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("core.api:app", host="0.0.0.0", port=8000, reload=True)
