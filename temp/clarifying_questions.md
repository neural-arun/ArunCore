# Clarifying Questions for Arun's Profile

*Instructions: Answer these questions directly beneath each question block. These answers will help refine the technical depth and future trajectory sections of your `public_profile.md` and complete the picture for ArunCore.*

## Section 1: Technical Depth & Tooling
1. **The Legal RAG System:** This sounds like a major accomplishment! Can you briefly describe the specific tools you used for it? (e.g., Did you use Pinecone or ChromaDB? LangChain? How did you chunk the complex legal texts?)
> Answer: i can give you the readme of that here it is:
Legal RAG System
A legal Retrieval-Augmented Generation (RAG) pipeline built for Indian legal documents.

This project processes legal PDFs, chunks them using document-specific strategies, stores embeddings in ChromaDB, retrieves relevant chunks for a query, and answers questions using a Groq-hosted LLM.

What This Project Does
Creates a manifest for all legal PDFs in docs/
Extracts raw text page by page
Cleans and structures each document before chunking
Chunks legal material by its real structure:
IPC by section
Constitution by article
Judgments by paragraph blocks
Validates chunk quality before embedding
Stores vectors in ChromaDB
Retrieves relevant legal chunks using exact reference + semantic search
Generates final answers using llama-3.3-70b-versatile on Groq
Current Corpus
The pipeline is designed around these documents:

IPC.pdf
constitution.pdf
case_1.PDF
case_2.PDF
These files are intentionally ignored by Git and should be placed inside the docs/ folder locally.

Project Structure
01_document_manifest.py
02_extract_text.py
03_clean_and_structure.py
04_chunk_documents.py
05_validate_chunks.py
06_embed_and_index.py
07_query.py
08_answer.py
requirements.txt
docs/
db/
output/
Pipeline
01_document_manifest.py
Scans docs/, identifies PDFs, and creates manifest.json.

02_extract_text.py
Extracts page-level text from each enabled PDF using pypdf.

03_clean_and_structure.py
Removes front matter, headers, and noisy pages. Detects the real body of each legal document.

04_chunk_documents.py
Chunks each document using a strategy based on document type:

statutes by section
constitution by article
judgments by paragraph blocks
Outputs clean chunks to output/chunks.json.

05_validate_chunks.py
Validates chunk IDs, metadata, page ranges, and suspicious chunk quality issues.

06_embed_and_index.py
Embeds chunks with OpenAI text-embedding-3-small and stores them in ChromaDB under db/.

07_query.py
Retrieves chunks for a legal query using:

exact reference matching for things like Section 302 IPC or Article 21
semantic retrieval from ChromaDB
lexical fallback if Chroma is unavailable
08_answer.py
Builds the final answer layer on top of retrieval using Groq llama-3.3-70b-versatile.

The CLI is kept simple:

prints only a clean question block
prints only the final answer block
if the answer is not found, it replies:
I do not have information regarding this.


2. **Handling Anti-Bot Systems:** When building the real estate listing and news scraper using Playwright, how did you bypass anti-bot protections like Cloudflare?
> Answer: here is the readme of this project:

99acres Real Estate Scraper Suite
A comprehensive set of Python scrapers designed to extract property listing data (Price, Location, Size, Contact) from 99acres.com.

📁 Project Structure
Real_estate_listing_scraper/
├── semantic_browser_scraper/  # Scraper v1: Uses browser text (Best for quick previews)
├── deep_browser_scraper/      # Scraper v2: Clicks every page (Best for zero N/A data)
├── parallel_http_scraperapi/  # Scraper v3: Parallel HTTP (High-scale professional)
├── data/                      # Output CSVs and HTML logic
├── research_and_debug/        # Initial recon and debugging scripts
└── venv/                      # Python virtual environment
🚀 Getting Started
1. Prerequisite: Virtual Environment
This project uses a shared virtual environment in the root folder. If you haven't created it yet:

python -m venv venv
.\venv\Scripts\activate
pip install playwright pandas beautifulsoup4 playwright-stealth httpx[http2]
playwright install chromium
2. Choose Your Scraper
Each scraper is designed for a different need:

Semantic Browser Scraper: Fast and free. Reads property cards directly from search results using text matching. Best for quick scans.
Deep Browser Scraper: The most accurate free method. It visits every individual listing page to extract hidden details. Use this if you want the highest quality data for free.
Parallel HTTP Scraper: Professional scale. No browser needed. It uses ScraperAPI to bypass Cloudflare and fetches 5+ pages in parallel. Best for large-scale data collection.
3. Running a Scraper
Navigate to any of the three folders and follow the instructions in its specific README.md. Example:

cd semantic_browser_scraper
..\venv\Scripts\activate
python scraper.py
📊 Data Output
All results are exported as CSV files. Each scraper is pre-configured to output data with these columns:

City: Target city name
Price: Listing price (e.g., ₹2.5 Cr)
Location: Full address or locality
Size (sqft): Area in sqft or yards
Contact Info: Agent/Builder/Owner details
URL: Link to the property (v2 and v3 only)
⚖️ Disclaimer & Ethics
This tool is for educational purposes. Scraping websites may violate their Terms of Service. Always check robots.txt, respect scraping limits, and ensure you have permission to use the data you collect.

Author: Arun Yadav Built for: Freelance Property Listing Demand

3. **Data Structuring:** As someone obsessed with data scraping and AI integration, how do you typically clean and structure your scraped data before feeding it into your RAG pipelines?
> Answer: I have never done anything like that but i am gonna do this in the future. I am planning to do this with the help of numpy and pandas. and i want to use AI as well to make data more structured and clean. 

4. **FastAPI & Data Storage:** You use FastAPI as your default backend. Are you currently pairing it with any specific databases (like PostgreSQL, MongoDB, or SQLite) to manage your users and scraped data?
> Answer: I have not yet worked with these type of databases but i am planning to do this very soon. I have only used the local storage of the computer to store data. and i have used vector DB in the form of ChromaDB. hosted locally.

## Section 2: Architecture & Future Tech
5. **Agentic System Architecture:** You see LLMs as foundational blocks for true "AI Agents." What framework (if any) are you currently using or planning to learn for orchestrating multi-agent systems? (e.g., CrewAI, AutoGen, LangGraph, or building custom logic?)
> Answer: I am planning to learn all of them i am currently following a course of udemy which teaches all of it.
> here is the course which i am taking:

# AI Engineer Agentic Track: The Complete Agent & MCP Course - Syllabus

## Topics You'll Learn

- Autonomous AI Agent Fundamentals
- AI Agent Frameworks (OpenAI SDK, CrewAI, LangGraph, AutoGen)
- Agentic AI vs Traditional Workflows
- LLM Autonomy & Tool Integration
- LLM Workflow Design Patterns
- Multi-LLM Orchestration
- GPT-4o, Claude, Gemini & DeepSeek Comparison
- Multi-LLM API Integration
- LLM API Comparison & Selection
- Multi-Model Response Evaluation Systems
- Tool Use & Function Calling
- Resources vs Tools in Agentic AI
- Structured Outputs
- Agent Engineering Setup (Cursor IDE, UV, API Configuration)
- Windows Development Environment Setup
- Mac Development Environment Setup
- Python for AI Development
- Git & Version Control
- OpenAI API Integration
- Building Agentic Workflows with OpenAI API
- Web Chatbot Development with Gradio
- Career Digital Twin Agent
- SDR (Sales Development Representative) Agent
- Professional Email Generation
- Deep Research Agents
- Multi-Agent Research Teams
- Stock Picker Agent with CrewAI
- Investment Automation
- 4-Agent Engineering Team
- Software Development Automation
- Docker & Containerization
- Coder Agents
- Browser-Based AI Sidekick
- LangGraph Implementation
- OpenAI's Operator Agent Replication
- Agent Creator (Meta-Agent)
- AutoGen Framework
- Trading Floor Agent System
- Autonomous Trading
- MCP (Model Context Protocol)
- MCP Servers
- Tool Integration (44+ Tools)
- Agent Deployment
- HuggingFace Spaces Deployment
- Production-Ready Agent Systems
- LLM Function Calling
- Push Alerts & Notifications
- Chat Loop Architecture
- Agent Evaluation & Testing

## Course Link
https://www.udemy.com/course/ai-engineer-agentic-track-the-complete-agent-mcp-course/

i will finish this course in next 15 days.

6. **UI/UX Preferences:** You prefer simple UIs or Telegram bots for fast deployment. Have you thought about learning a modern frontend framework like React/Next.js, or will you stick to Python-native UIs (like Streamlit/Gradio) and messaging bots?
> Answer: I am planning to learn TO create UIs but i do not want to learnt it like i learnt python. i will not give this much time to it. i will use AI to create UIs for me. and i will try to understand things on the go.

7. **ArunCore's Knowledge Base:** For your digital twin "ArunCore," what format are you using to feed it your personal data (markdown, JSON, PDFs)? And how will you handle "updates" when you learn new skills or finish new projects?
> Answer: I am using markdown files to feed my personal data to ArunCore. and i will handle updates by updating the markdown files.

## Section 3: Vision & Monetization
8. **The 3-Month Goal:** You mentioned a strong desire to build systems for passive income and "make a huge lot of money" in the next three months. Do you have a specific SaaS idea, niche, or freelance service in mind right now, or are you still exploring ideas?
> Answer: I have freelance service in my mind i want to earn a lot of money by freelancing in next 3 months. in freelance i want to build projects for the clients which gives them value or solve a painfull problem or save time i want to these things and make a ton of money.

9. **Target Audience:** You want to move away from "toy projects" to things that provide real value. Who is the target user for the systems you want to build next? (e.g., students, legal professionals, small businesses?)
> Answer: everybody. I want to earn a lot of money so i would like to work for the businesses and rich people for whom i solve a problem  and get paid for it atleast for the next 3 months. i want to get a taste of how it feels to earn money. 
> for long term i want to do something big in healthcare sector and eduction sector. big like really big like a company which can provide patients and students real cheap value for thiere money.

10. **Your Learning Funnel:** Now that you've escaped "tutorial hell," how do you decide what specific project to build next? Is it based on a new technology you want to learn, or entirely based on a problem you want to solve?
> Answer: I want to build projects which are related to AI agents and AI engineering. and i want to build projects which can help me earn money. like i am building this ArunCore.and the previous multiple projects which i have built were also focussed on these things.
