# Design Decisions & Rationale

**Decision Records:** [ArunCore/core/agent.py](https://github.com/neural-arun/ArunCore/tree/main/core/agent.py)

---

## 🧭 Technical Evolution
Building a digital twin requires solving unique edge cases. Below are the core architectural decisions made to ensure high reliability.

### 1. The "Search Budget" (The 3-Strike Rule)
- **Problem:** AI would loop indefinitely searching for synonyms when asked sensitive or subjective questions (e.g., "Is Arun a bad person?").
- **Decision:** Implemented a hard **3-search limit** per user message. 
- **Rationale:** If the AI hasn't found answer after 3 targeted searches, it never will. By capping the budget, we prevent "Token Burn" and ensure the user gets a fast, professional response explaining the lack of data.

### 2. Dual-Component UI Architecture
- **Problem:** Traditional media queries often failed to correctly hide complex sidebar elements on mobile browsers, leading to layout shifts and clipping.
- **Decision:** Switched to a **React-level Layout Split**. The code detects screen width and selectively renders either `MobileLayout` or `DesktopLayout`.
- **Rationale:** This physically removes the sidebar code from the mobile view, eliminating CSS inheritance bugs and optimizing memory usage on mobile devices.

### 3. ReactMarkdown + RemarkGFM
- **Problem:** AI-generated tables and lists were appearing as raw text walls, reducing professional impact.
- **Decision:** Integrated a full Markdown engine with GitHub Flavored Markdown (GFM) support.
- **Rationale:** This allows the AI to generate **real data tables**, bold text, and clickable links, matching the high-end design aesthetic of the interface.

### 4. Rolling Memory vs. Simple Concatenation
- **Problem:** Long conversations would eventually crash the session due to the LLM context window becoming full.
- **Decision:** Built a **Summarization-based Rolling Memory**. Every 4 turns, the conversation is summarized and compressed.
- **Rationale:** This allows for "infinite" conversations without losing track of technical details, as the summary preserves key project mentions while discarding conversational filler.

### 5. Git LFS for Asset Identity
- **Problem:** High-resolution profile photos were being rejected by cloud hosting platforms (HuggingFace) due to binary file size limits in Git.
- **Decision:** Migrated all `.png` assets to **Git Large File Storage (LFS)**.
- **Rationale:** Ensures that identity branding (headshots and logos) is preserved in high definition across all environments without breaking deployment pipelines.
