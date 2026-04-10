# ArunCore: High-Level System Design

This document outlines the high-level architecture and data flow for the ArunCore personal AI agent.

## System Architecture Diagram

```mermaid
graph TD
    User["User Query"] --> API["FastAPI Backend"]
    API --> Router["Intent Router (Classification)"]
    
    %% Paths from Router
    Router -->|Intent: Identity/Rules| Static["Static Layer<br/>(Markdown Profile/Rules)"]
    Router -->|Intent: Recent/Live| LiveAPI["Live Layer<br/>(GitHub API)"]
    Router -->|Intent: Deep Knowledge/History| Retrieval["Retrieval Pipeline<br/>(RAG)"]
    
    %% Retrieval Pipeline
    subgraph Retrieval Pipeline
        Retrieval --> Embed["Embed Query"]
        Embed --> VectorDB[("Vector DB (Qdrant)<br/>Hybrid: Keyword + Semantic")]
        VectorDB -->|Top 20 Chunks| Rerank["Cross-Encoder Re-ranker"]
        Rerank -->|Top 3-5 Chunks| FilteredData["High-Confidence Context"]
    end
    
    %% Synthesis Stage
    Static --> Synthesizer
    LiveAPI --> Synthesizer
    FilteredData --> Synthesizer
    
    Synthesizer["Prompt Synthesizer<br/>(Builder: Context + Rules + Query)"] --> LLM(("LLM Engine<br/>(e.g., Claude/GPT-4o)"))
    LLM --> Response["Final Truthful Response"]
    Response --> API
    API --> User
    
    %% Offline Ingestion
    subgraph Data Ingestion (Offline)
        Raw["Raw Markdown<br/>+ YAML Metadata"] --> Chunker["Semantic Chunker"]
        Chunker --> EmbedOffline["Embedding Model"]
        EmbedOffline --> VectorDB
    end

    classDef db fill:#f9f,stroke:#333,stroke-width:2px;
    classDef LLM fill:#e1d5e7,stroke:#9673a6,stroke-width:2px;
    class VectorDB db;
    class LLM LLM;
```

## Component Breakdown

1. **FastAPI Backend**: The entry point for all queries. Exposes REST endpoints to whatever client (web UI, terminal, chat app) you decide to build.
2. **Intent Router**: The traffic cop. It analyzes the incoming query and decides whether to fetch static text, hit a live API, or perform a heavy vector search.
3. **Retrieval Pipeline**: Contains the Embedding model, Qdrant Vector database, and the Re-ranker. This is the bulk of the system's "memory".
4. **Prompt Synthesizer**: Compiles the final prompt. It injects the core rules, the identity markdown, and the specifically retrieved data into a single coherent prompt.
5. **LLM Engine**: Generates the language response based *strictly* on what the Prompt Synthesizer feeds it.
6. **Data Ingestion (Offline)**: A standalone pipeline that only runs when you want to update your memory banks with new projects or notes.
