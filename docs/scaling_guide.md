# Scaling & Deployment Guide

This document outlines the upgrade path for transitioning ArunCore from a local/HuggingFace prototype environment to an enterprise-grade cloud-native deployment capable of handling massive traffic spikes and highly decoupled CI/CD.

## Level 1: Vector Database Migration
Currently, ArunCore relies on a local instance of **ChromaDB**. The `db/` folder is actively persisted in the filesystem. While this works beautifully for server-side monolithic deployments (like HuggingFace Spaces), it breaks down in serverless environments (like Vercel Lambdas) because serverless functions are ephemeral and cannot read/write persistent local files reliably.

### Upgrading to Pinecone or Weaviate
To completely decouple the backend architecture for infinite scaling:
1.  **Select a Cloud Vector Engine:** Sign up for an API-based hosted vector database like Pinecone.
2.  **Modify `ingest.py`:** Update the chunking pipeline to serialize data using standard LangChain Pinecone bindings instead of Chroma bindings.
3.  **Update `agent.py`:** Change the `init_agent()` vectorstore configuration.
    ```python
    # Target Architecture
    from langchain_pinecone import PineconeVectorStore
    _GLOBAL_VECTORSTORE = PineconeVectorStore(index_name="aruncore", embedding=embeddings)
    ```
4.  **Action:** With this change, the entire `db/` folder can be deleted, drastically lowering the repository size limit.

## Level 2: Backend API Severance (Vercel / AWS)
Right now, the FastAPI (`core/api.py`) runs as a persistent listener. But for true cost-efficiency and auto-scaling, the Python engine should be moved to Serverless Functions.
1.  Since you deployed the Node.js frontend on Vercel, Vercel also supports Python Serverless Edge functions.
2.  Move the `api.py` endpoint from FastAPI to the `api/` directory format expected by Vercel inside the Next.js `frontend` directory. 
3.  Update the timeout limits. LLM operations take 10-30 seconds, so ensure Vercel limits are set up to handle long-running transactions (or migrate to a WebSocket/streaming model).

## Level 3: Streaming Responses
For the best UI experience during long LangChain loops (when it's searching the DB multiple times), switch from a blocked REST request (`POST /chat`) to HTTP Streaming (`text/event-stream`). Update the `main_llm` invocation to yield tokens dynamically, passing the feeling of immediate speed to the user while backend processes crunch data.
