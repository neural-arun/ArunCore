import os
import json
import hashlib
from pathlib import Path
from dotenv import load_dotenv

import chromadb
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# Load environment variables from .env file if it exists
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_DIR = BASE_DIR / "db"
STATE_FILE = DB_DIR / "ingestion_state.json"

# Folders to parse for the Vector DB
INGEST_DIRS = ["github", "raw", "linkedin"]

def get_file_hash(filepath: Path) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        return hashlib.md5(f.read().encode("utf-8")).hexdigest()

def load_state() -> dict:
    if STATE_FILE.exists():
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {}

def save_state(state: dict):
    os.makedirs(DB_DIR, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

def process_markdown_file(filepath: Path, base_folder: str, rel_path: str):
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    # Split markdown by headers to keep semantic sections intact
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    md_header_splits = markdown_splitter.split_text(text)

    # Further split sections that might be too long to fit in embedding models
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)
    splits = text_splitter.split_documents(md_header_splits)

    # Base ID mechanism (e.g. raw_personal_background)
    safe_name = filepath.stem.replace(" ", "_").replace(".", "_")
    
    # Extract project name if inside github folder
    project_name = "N/A"
    parts = list(filepath.relative_to(DATA_DIR).parts)
    if "github" in parts and len(parts) > 1:
        project_name = parts[1]

    for i, split in enumerate(splits):
        split.metadata["source"] = rel_path
        split.metadata["folder"] = base_folder
        split.metadata["project"] = project_name
        
        # Deterministic chunk ID
        chunk_id = f"{base_folder}_{project_name}_{safe_name}_chunk_{i}"
        split.metadata["chunk_id"] = chunk_id
        
    return splits

def process_json_file(filepath: Path, base_folder: str, rel_path: str):
    # For small metadata or code_summaries files, load as a single chunk
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    project_name = "N/A"
    parts = list(filepath.relative_to(DATA_DIR).parts)
    if "github" in parts and len(parts) > 1:
        project_name = parts[1]

    safe_name = filepath.stem.replace(" ", "_").replace(".", "_")
    chunk_id = f"{base_folder}_{project_name}_{safe_name}_chunk_0"
    
    doc = Document(
        page_content=content,
        metadata={
            "source": rel_path,
            "folder": base_folder,
            "project": project_name,
            "chunk_id": chunk_id
        }
    )
    return [doc]

def main():
    if not os.getenv("OPENAI_API_KEY"):
        print("\n[ERROR] OPENAI_API_KEY not found in the environment.")
        print("Please set it or create a .env file containing OPENAI_API_KEY=your_key_here")
        return

    print("Initializing ChromaDB and OpenAI Embeddings...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    
    vectorstore = Chroma(
        collection_name="aruncore_knowledge",
        embedding_function=embeddings,
        persist_directory=str(DB_DIR)
    )

    state = load_state()
    new_state = {}
    
    docs_to_embed = []
    ids_to_embed = []
    
    # 1. Gather & Process Files
    for folder in INGEST_DIRS:
        target_dir = DATA_DIR / folder
        if not target_dir.exists():
            continue
            
        for ext in ["*.md", "*.json"]:
            for filepath in target_dir.rglob(ext):
                # Extra safety: Ensure we don't accidentally embed any test_set data
                if "test_set" in filepath.parts:
                    continue
                    
                file_hash = get_file_hash(filepath)
                rel_path = filepath.relative_to(BASE_DIR).as_posix()
                
                new_state[rel_path] = file_hash
                
                if rel_path in state and state[rel_path] == file_hash:
                    # Hash matches, skip file
                    continue
                
                print(f"File changed/new -> Processing: {rel_path}")
                
                splits = []
                if filepath.suffix == '.md':
                    splits = process_markdown_file(filepath, folder, rel_path)
                elif filepath.suffix == '.json':
                    splits = process_json_file(filepath, folder, rel_path)
                    
                docs_to_embed.extend(splits)
                ids_to_embed.extend([s.metadata["chunk_id"] for s in splits])

    # 2. Upsert to DB
    if docs_to_embed:
        print(f"\nAdding {len(docs_to_embed)} new/modified chunks to Vector DB...")
        vectorstore.add_documents(documents=docs_to_embed, ids=ids_to_embed)
        print("Database updated.")
    else:
        print("\nNo files have changed. Database is 100% up to date.")
        
    save_state(new_state)
    print("Ingestion sequence complete.")

if __name__ == "__main__":
    main()
