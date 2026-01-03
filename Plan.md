# NotesAI - Implementation Plan

## Overview

This document provides a step-by-step implementation guide to build the NotesAI MVP from scratch. The plan is divided into 3 phases, with a test at the end of each phase to validate progress.

**Tech Stack:**
- Frontend: Next.js + TypeScript + Tailwind
- Backend: FastAPI + Python
- Database: Supabase (PostgreSQL)
- Vector DB: Pinecone
- LLM: Claude API (Anthropic)
- Embeddings: OpenAI

---

## Prerequisites & Setup

### 1. Install Required Tools

```bash
# Python 3.11+
python --version

# Node.js 18+
node --version

# Git
git --version
```

### 2. Get API Credentials

#### Supabase
1. Go to https://supabase.com
2. Create new project
3. Get credentials from Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
4. Get database connection string from Settings → Database

#### Pinecone
1. Go to https://www.pinecone.io
2. Create account and new index:
   - Name: `notes-ai`
   - Dimensions: `1536`
   - Metric: `cosine`
3. Get API key from API Keys section

#### Anthropic Claude
1. Go to https://console.anthropic.com
2. Create API key
3. Save `ANTHROPIC_API_KEY`

#### OpenAI
1. Go to https://platform.openai.com
2. Create API key
3. Save `OPENAI_API_KEY`

---

## Phase 1: Backend Foundation & Database Setup

**Goal:** Set up FastAPI backend with PDF upload and Supabase integration

### Step 1.1: Initialize Backend

```bash
# Create backend directory
cd notes_ai
mkdir backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Create project structure
mkdir -p app/api/routes app/services app/models app/core
touch app/__init__.py
touch app/main.py
touch app/api/__init__.py
touch app/api/routes/__init__.py
```

### Step 1.2: Install Dependencies

```bash
# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-dotenv==1.0.0
supabase==2.0.3
pydantic==2.5.0
pydantic-settings==2.1.0
EOF

# Install
pip install -r requirements.txt
```

### Step 1.3: Environment Configuration

```bash
# Create .env file
cat > .env << EOF
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# API Keys (we'll use these in Phase 2 & 3)
ANTHROPIC_API_KEY=your-claude-key
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-east-1

# App Settings
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=./uploads
EOF
```

### Step 1.4: Configuration Module

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # API Keys
    anthropic_api_key: str
    openai_api_key: str
    pinecone_api_key: str
    pinecone_environment: str

    # App Settings
    max_file_size_mb: int = 50
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()
```

### Step 1.5: Database Schemas (Supabase)

Create tables in Supabase SQL Editor:

```sql
-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'processing',
    total_pages INTEGER,
    total_chunks INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    generation_time_seconds INTEGER
);

-- Job status table
CREATE TABLE job_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'processing',
    progress INTEGER DEFAULT 0,
    current_stage VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_job_status_doc_id ON job_status(doc_id);
CREATE INDEX idx_notes_doc_id ON notes(doc_id);
```

### Step 1.6: Supabase Client

```python
# app/core/database.py
from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)

def get_supabase() -> Client:
    return supabase
```

### Step 1.7: Pydantic Models

```python
# app/models/schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class DocumentCreate(BaseModel):
    filename: str
    file_size: int

class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    status: str
    upload_timestamp: datetime

class JobStatusResponse(BaseModel):
    doc_id: UUID
    status: str
    progress: int
    current_stage: Optional[str] = None

class UploadResponse(BaseModel):
    doc_id: UUID
    status: str
    message: str
```

### Step 1.8: Upload Endpoint

```python
# app/api/routes/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.models.schemas import UploadResponse
from app.core.database import get_supabase
from app.core.config import get_settings
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/api", tags=["upload"])
settings = get_settings()

# Create upload directory
os.makedirs(settings.upload_dir, exist_ok=True)

@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Upload a PDF file for processing
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Read file
    contents = await file.read()
    file_size = len(contents)

    # Validate file size
    max_size = settings.max_file_size_mb * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.max_file_size_mb}MB"
        )

    # Generate document ID
    doc_id = uuid.uuid4()

    # Save file locally
    file_path = Path(settings.upload_dir) / f"{doc_id}.pdf"
    with open(file_path, "wb") as f:
        f.write(contents)

    # Create database record
    supabase = get_supabase()

    # Insert document
    doc_result = supabase.table("documents").insert({
        "id": str(doc_id),
        "filename": file.filename,
        "file_size": file_size,
        "status": "uploaded"
    }).execute()

    # Insert job status
    supabase.table("job_status").insert({
        "doc_id": str(doc_id),
        "status": "uploaded",
        "progress": 0,
        "current_stage": "File uploaded, ready for processing"
    }).execute()

    return UploadResponse(
        doc_id=doc_id,
        status="uploaded",
        message="PDF uploaded successfully"
    )
```

### Step 1.9: Status Endpoint

```python
# app/api/routes/status.py
from fastapi import APIRouter, HTTPException
from app.models.schemas import JobStatusResponse
from app.core.database import get_supabase
from uuid import UUID

router = APIRouter(prefix="/api", tags=["status"])

@router.get("/status/{doc_id}", response_model=JobStatusResponse)
async def get_status(doc_id: UUID):
    """
    Get processing status for a document
    """
    supabase = get_supabase()

    # Query job status
    result = supabase.table("job_status")\
        .select("*")\
        .eq("doc_id", str(doc_id))\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    job = result.data[0]

    return JobStatusResponse(
        doc_id=UUID(job["doc_id"]),
        status=job["status"],
        progress=job["progress"],
        current_stage=job.get("current_stage")
    )
```

### Step 1.10: Main FastAPI App

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload, status

app = FastAPI(
    title="NotesAI API",
    version="1.0.0",
    description="AI-powered aesthetic note generator"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(status.router)

@app.get("/")
async def root():
    return {"message": "NotesAI API v1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Step 1.11: Run Backend

```bash
# From backend directory
```

### ✅ Phase 1 Test

**Test the upload endpoint:**

```bash
# Test 1: Health check
curl http://localhost:8000/health

# Test 2: Upload a PDF
curl -X POST http://localhost:8000/api/upload \
  -F "file=@test.pdf"

# Expected response:
# {
#   "doc_id": "some-uuid",
#   "status": "uploaded",
#   "message": "PDF uploaded successfully"
# }

# Test 3: Check status
curl http://localhost:8000/api/status/{doc_id}

# Expected response:
# {
#   "doc_id": "some-uuid",
#   "status": "uploaded",
#   "progress": 0,
#   "current_stage": "File uploaded, ready for processing"
# }
```

**Verify in Supabase:**
- Go to Supabase dashboard → Table Editor
- Check `documents` table has the uploaded file record
- Check `job_status` table has the job entry

✅ **Phase 1 Complete** when you can upload a PDF and see it in Supabase!

---

## Phase 2: RAG Pipeline (PDF Processing & Embeddings)

**Goal:** Extract text from PDF, chunk it, generate embeddings, store in Pinecone

### Step 2.1: Install Additional Dependencies

```bash
# Add to requirements.txt
cat >> requirements.txt << EOF
PyMuPDF==1.23.8
openai==1.3.0
pinecone-client==3.0.0
tiktoken==0.5.1
EOF

# Install
pip install -r requirements.txt
```

### Step 2.2: PDF Processor Service

```python
# app/services/pdf_processor.py
import fitz  # PyMuPDF
from typing import List, Dict
import re

class Chunk:
    def __init__(self, text: str, page: int, chunk_index: int, heading: str = None):
        self.text = text
        self.page = page
        self.chunk_index = chunk_index
        self.heading = heading
        self.chunk_id = f"page{page}_chunk{chunk_index}"

class PDFProcessor:
    def __init__(self, max_tokens: int = 800, overlap: int = 200):
        self.max_tokens = max_tokens
        self.overlap = overlap

    def extract_and_chunk(self, pdf_path: str) -> List[Dict]:
        """
        Extract text from PDF and create semantic chunks
        """
        doc = fitz.open(pdf_path)
        chunks = []

        for page_num, page in enumerate(doc):
            # Extract text
            text = page.get_text()

            if not text.strip():
                continue

            # Detect heading (first line if it's short and bold)
            lines = text.split('\n')
            heading = lines[0] if lines and len(lines[0]) < 100 else None

            # Chunk the page text
            page_chunks = self._chunk_text(text, page_num + 1, heading)
            chunks.extend(page_chunks)

        doc.close()

        return [
            {
                "chunk_id": chunk.chunk_id,
                "text": chunk.text,
                "page": chunk.page,
                "heading": chunk.heading,
                "chunk_index": chunk.chunk_index
            }
            for chunk in chunks
        ]

    def _chunk_text(self, text: str, page: int, heading: str) -> List[Chunk]:
        """
        Split text into chunks with overlap
        """
        # Simple word-based chunking
        words = text.split()
        chunks = []
        chunk_index = 0

        # Approximate tokens (1 token ≈ 0.75 words)
        words_per_chunk = int(self.max_tokens * 0.75)
        overlap_words = int(self.overlap * 0.75)

        i = 0
        while i < len(words):
            chunk_words = words[i:i + words_per_chunk]
            chunk_text = ' '.join(chunk_words)

            chunks.append(Chunk(
                text=chunk_text,
                page=page,
                chunk_index=chunk_index,
                heading=heading
            ))

            chunk_index += 1
            i += words_per_chunk - overlap_words

        return chunks

    def get_total_pages(self, pdf_path: str) -> int:
        """Get total number of pages in PDF"""
        doc = fitz.open(pdf_path)
        total = len(doc)
        doc.close()
        return total
```

### Step 2.3: Embedding Service

```python
# app/services/embeddings.py
from openai import OpenAI
from app.core.config import get_settings
from typing import List

settings = get_settings()

class EmbeddingService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "text-embedding-3-small"

    def embed(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=texts
        )
        return [item.embedding for item in response.data]
```

### Step 2.4: Pinecone Client

```python
# app/services/pinecone_client.py
from pinecone import Pinecone, ServerlessSpec
from app.core.config import get_settings
from typing import List, Dict

settings = get_settings()

class PineconeClient:
    def __init__(self):
        self.pc = Pinecone(api_key=settings.pinecone_api_key)
        self.index_name = "notes-ai"

        # Create index if it doesn't exist
        if self.index_name not in self.pc.list_indexes().names():
            self.pc.create_index(
                name=self.index_name,
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region=settings.pinecone_environment
                )
            )

        self.index = self.pc.Index(self.index_name)

    def upsert_chunks(self, doc_id: str, chunks: List[Dict]):
        """
        Store chunks with embeddings in Pinecone
        """
        vectors = [
            {
                "id": f"{doc_id}_{chunk['chunk_id']}",
                "values": chunk["embedding"],
                "metadata": {
                    "doc_id": doc_id,
                    "text": chunk["text"][:1000],  # Limit metadata size
                    "page": chunk["page"],
                    "heading": chunk.get("heading", ""),
                    "chunk_index": chunk["chunk_index"]
                }
            }
            for chunk in chunks
        ]

        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=doc_id)

    def fetch_all(self, doc_id: str) -> List[Dict]:
        """
        Retrieve all chunks for a document
        """
        # Query with a dummy vector to get all results
        results = self.index.query(
            namespace=doc_id,
            vector=[0.0] * 1536,
            top_k=10000,
            include_metadata=True
        )

        return [
            {
                "text": match.metadata["text"],
                "page": match.metadata["page"],
                "heading": match.metadata.get("heading"),
                "chunk_index": match.metadata["chunk_index"]
            }
            for match in results.matches
        ]

    def delete_namespace(self, doc_id: str):
        """
        Delete all vectors for a document
        """
        self.index.delete(namespace=doc_id, delete_all=True)
```

### Step 2.5: Background Processing Pipeline

```python
# app/services/processing_pipeline.py
from app.services.pdf_processor import PDFProcessor
from app.services.embeddings import EmbeddingService
from app.services.pinecone_client import PineconeClient
from app.core.database import get_supabase
from pathlib import Path
import time

async def process_pdf_pipeline(doc_id: str, pdf_path: str):
    """
    Complete PDF processing pipeline:
    1. Extract and chunk
    2. Generate embeddings
    3. Store in Pinecone
    4. Update database
    """
    supabase = get_supabase()

    try:
        # Step 1: Extract and chunk
        update_job_status(doc_id, "processing", 10, "Extracting text from PDF...")

        processor = PDFProcessor()
        chunks = processor.extract_and_chunk(pdf_path)
        total_pages = processor.get_total_pages(pdf_path)

        if not chunks:
            raise Exception("No text extracted from PDF")

        # Step 2: Generate embeddings
        update_job_status(doc_id, "processing", 30, f"Generating embeddings for {len(chunks)} chunks...")

        embedding_service = EmbeddingService()

        for i, chunk in enumerate(chunks):
            chunk["embedding"] = embedding_service.embed(chunk["text"])

            # Update progress
            progress = 30 + int(50 * (i + 1) / len(chunks))
            if i % 10 == 0:  # Update every 10 chunks
                update_job_status(
                    doc_id,
                    "processing",
                    progress,
                    f"Processing chunk {i+1}/{len(chunks)}..."
                )

        # Step 3: Store in Pinecone
        update_job_status(doc_id, "processing", 85, "Storing vectors in database...")

        pinecone_client = PineconeClient()
        pinecone_client.upsert_chunks(doc_id, chunks)

        # Step 4: Update document record
        supabase.table("documents").update({
            "status": "ready",
            "total_pages": total_pages,
            "total_chunks": len(chunks)
        }).eq("id", doc_id).execute()

        # Step 5: Update job status
        update_job_status(doc_id, "ready", 100, "Processing complete. Ready for note generation.")

    except Exception as e:
        # Update error status
        supabase.table("documents").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", doc_id).execute()

        update_job_status(doc_id, "failed", 0, f"Error: {str(e)}")

        raise

def update_job_status(doc_id: str, status: str, progress: int, stage: str):
    """Helper to update job status"""
    supabase = get_supabase()
    supabase.table("job_status").update({
        "status": status,
        "progress": progress,
        "current_stage": stage
    }).eq("doc_id", doc_id).execute()
```

### Step 2.6: Update Upload Endpoint to Trigger Processing

```python
# app/api/routes/upload.py (UPDATE)
from app.services.processing_pipeline import process_pdf_pipeline

@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    # ... (previous validation code stays the same) ...

    # Add background task for processing
    background_tasks.add_task(
        process_pdf_pipeline,
        str(doc_id),
        str(file_path)
    )

    return UploadResponse(
        doc_id=doc_id,
        status="processing",
        message="PDF uploaded and processing started"
    )
```

### ✅ Phase 2 Test

**Test the full processing pipeline:**

```bash
# Test 1: Upload a PDF (it will now process automatically)
curl -X POST http://localhost:8000/api/upload \
  -F "file=@test.pdf"

# Save the doc_id from response

# Test 2: Poll status (wait a few seconds between calls)
curl http://localhost:8000/api/status/{doc_id}

# You should see progress updates:
# - "Extracting text from PDF..." (10%)
# - "Generating embeddings..." (30-80%)
# - "Storing vectors..." (85%)
# - "Processing complete" (100%, status: "ready")

# Test 3: Check Pinecone dashboard
# - Go to https://app.pinecone.io
# - Check your index "notes-ai"
# - Verify vectors are stored under namespace = doc_id
```

**Verify in Supabase:**
- `documents` table: `status` = "ready", `total_chunks` populated
- `job_status` table: `status` = "ready", `progress` = 100

✅ **Phase 2 Complete** when a PDF is fully processed and chunks are in Pinecone!

---

## Phase 3: Note Generation & Frontend Integration

**Goal:** Generate comprehensive notes using Claude and connect frontend

### Step 3.1: Install Final Dependencies

```bash
# Add to requirements.txt
cat >> requirements.txt << EOF
anthropic==0.7.0
EOF

pip install -r requirements.txt
```

### Step 3.2: Claude Client

```python
# app/services/claude_client.py
from anthropic import Anthropic
from app.core.config import get_settings
import json

settings = get_settings()

class ClaudeClient:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-3-5-sonnet-20241022"

    def generate(self, system: str, user: str, max_tokens: int = 4000) -> str:
        """
        Generate text using Claude
        """
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[
                {"role": "user", "content": user}
            ]
        )

        return response.content[0].text

    def generate_structured(self, system: str, user: str) -> dict:
        """
        Generate and parse JSON response
        """
        response_text = self.generate(system, user, max_tokens=4000)

        # Extract JSON from response (handle code blocks)
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()

        return json.loads(json_str)
```

### Step 3.3: RAG Engine (Map-Reduce)

```python
# app/core/rag.py
from app.services.pinecone_client import PineconeClient
from app.services.claude_client import ClaudeClient
from typing import List, Dict
import json

SYSTEM_PROMPT = """You are an expert educational content creator specializing in comprehensive, aesthetic study notes.

YOUR TASK: Transform lecture content into detailed, beautifully structured notes that preserve ALL information while enhancing clarity.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "heading": "Section title",
  "introduction": "Brief context for this section",
  "subsections": [
    {
      "subheading": "Subtopic name",
      "points": ["Detailed point 1", "Detailed point 2"],
      "examples": ["Complete example with explanation"],
      "formulas": [
        {
          "formula": "Mathematical expression",
          "explanation": "What it means"
        }
      ]
    }
  ],
  "keyTerms": [
    {"term": "Exact term", "definition": "Complete definition"}
  ]
}

REQUIREMENTS:
- Include ALL information (don't summarize)
- Preserve all definitions, formulas, examples
- Use clear hierarchical structure
- Make it exam-ready and aesthetically formatted"""

class RAGEngine:
    def __init__(self):
        self.pinecone_client = PineconeClient()
        self.claude_client = ClaudeClient()

    def generate_comprehensive_notes(self, doc_id: str) -> Dict:
        """
        Generate comprehensive notes using Map-Reduce pattern
        """
        # Step 1: Retrieve all chunks
        chunks = self.pinecone_client.fetch_all(doc_id)

        if not chunks:
            raise Exception("No chunks found for this document")

        # Sort by page and chunk index
        chunks = sorted(chunks, key=lambda x: (x["page"], x["chunk_index"]))

        # Step 2: Group by sections (by heading or page ranges)
        sections = self._group_by_section(chunks)

        # Step 3: MAP - Generate notes for each section
        section_notes = []
        for section_name, section_chunks in sections.items():
            notes = self._generate_section_notes(section_name, section_chunks)
            section_notes.append(notes)

        # Step 4: REDUCE - Combine into final structure
        final_notes = self._combine_sections(section_notes, chunks[0].get("heading", "Lecture Notes"))

        return final_notes

    def _group_by_section(self, chunks: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Group chunks by section (heading or page ranges)
        """
        sections = {}
        current_section = None
        section_chunks = []

        for chunk in chunks:
            heading = chunk.get("heading")

            # Start new section if we find a heading
            if heading and heading != current_section:
                if current_section and section_chunks:
                    sections[current_section] = section_chunks
                current_section = heading
                section_chunks = [chunk]
            else:
                # No heading - group by page ranges (every 3-5 pages)
                if not current_section:
                    current_section = f"Section (Pages {chunk['page']}-{chunk['page']+2})"
                section_chunks.append(chunk)

                # Create new section every 5 pages
                if len(section_chunks) >= 10:  # ~10 chunks ≈ 5 pages
                    sections[current_section] = section_chunks
                    current_section = None
                    section_chunks = []

        # Add remaining chunks
        if current_section and section_chunks:
            sections[current_section] = section_chunks

        return sections

    def _generate_section_notes(self, section_name: str, chunks: List[Dict]) -> Dict:
        """
        Generate notes for a single section using Claude
        """
        # Combine chunk texts
        context = "\n\n".join([
            f"[Page {chunk['page']}]\n{chunk['text']}"
            for chunk in chunks
        ])

        user_prompt = f"""Generate comprehensive, detailed notes for this section.

SECTION: {section_name}

CONTENT:
{context}

Remember:
- Include ALL information (don't skip details)
- Preserve all definitions, formulas, examples
- Maintain logical flow
- Return valid JSON only (no markdown, no code blocks)"""

        try:
            notes = self.claude_client.generate_structured(SYSTEM_PROMPT, user_prompt)
            return notes
        except Exception as e:
            # Fallback structure if parsing fails
            return {
                "heading": section_name,
                "introduction": "Error processing section",
                "subsections": [],
                "keyTerms": []
            }

    def _combine_sections(self, section_notes: List[Dict], title: str) -> Dict:
        """
        Combine all section notes into final structure
        """
        # Merge all key terms
        all_key_terms = []
        for section in section_notes:
            all_key_terms.extend(section.get("keyTerms", []))

        # Deduplicate key terms
        unique_terms = {term["term"]: term for term in all_key_terms}
        key_terms = list(unique_terms.values())

        # Generate executive summary
        summary = self._generate_summary(section_notes)

        return {
            "title": title or "Lecture Notes",
            "summary": summary,
            "keyTerms": key_terms,
            "sections": section_notes
        }

    def _generate_summary(self, section_notes: List[Dict]) -> str:
        """
        Generate brief executive summary from all sections
        """
        headings = [section.get("heading", "Section") for section in section_notes]

        summary_prompt = f"""Based on these section headings, write a 2-3 sentence executive summary of what this lecture covers:

{', '.join(headings)}

Return ONLY the summary text (no JSON, no formatting)."""

        try:
            return self.claude_client.generate(
                "You are a concise summarizer.",
                summary_prompt,
                max_tokens=200
            ).strip()
        except:
            return f"This lecture covers {len(section_notes)} main topics including {', '.join(headings[:3])}."
```

### Step 3.4: Notes Generation Endpoint

```python
# app/api/routes/notes.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import NoteGenerationResponse
from app.core.rag import RAGEngine
from app.core.database import get_supabase
from uuid import UUID
import time

router = APIRouter(prefix="/api/notes", tags=["notes"])

# Add this to schemas.py
class NoteGenerationResponse(BaseModel):
    doc_id: UUID
    status: str
    message: str

class NoteResponse(BaseModel):
    doc_id: UUID
    notes: Dict[str, Any]
    generated_at: datetime

@router.post("/generate/{doc_id}", response_model=NoteGenerationResponse)
async def generate_notes(doc_id: UUID, background_tasks: BackgroundTasks):
    """
    Trigger note generation for a processed document
    """
    supabase = get_supabase()

    # Check if document is ready
    doc_result = supabase.table("documents")\
        .select("*")\
        .eq("id", str(doc_id))\
        .execute()

    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = doc_result.data[0]

    if doc["status"] != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document not ready. Current status: {doc['status']}"
        )

    # Update status to generating
    supabase.table("documents").update({
        "status": "generating"
    }).eq("id", str(doc_id)).execute()

    supabase.table("job_status").update({
        "status": "generating",
        "progress": 0,
        "current_stage": "Starting note generation..."
    }).eq("doc_id", str(doc_id)).execute()

    # Trigger background generation
    background_tasks.add_task(
        generate_notes_pipeline,
        str(doc_id)
    )

    return NoteGenerationResponse(
        doc_id=doc_id,
        status="generating",
        message="Note generation started"
    )

@router.get("/{doc_id}", response_model=NoteResponse)
async def get_notes(doc_id: UUID):
    """
    Get generated notes for a document
    """
    supabase = get_supabase()

    result = supabase.table("notes")\
        .select("*")\
        .eq("doc_id", str(doc_id))\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Notes not found")

    note = result.data[0]

    return NoteResponse(
        doc_id=UUID(note["doc_id"]),
        notes=note["content"],
        generated_at=note["generated_at"]
    )

async def generate_notes_pipeline(doc_id: str):
    """
    Background task for note generation
    """
    supabase = get_supabase()
    start_time = time.time()

    try:
        rag_engine = RAGEngine()

        # Update progress
        supabase.table("job_status").update({
            "progress": 20,
            "current_stage": "Retrieving document chunks..."
        }).eq("doc_id", doc_id).execute()

        # Generate notes
        supabase.table("job_status").update({
            "progress": 40,
            "current_stage": "Generating comprehensive notes..."
        }).eq("doc_id", doc_id).execute()

        notes = rag_engine.generate_comprehensive_notes(doc_id)

        # Save to database
        supabase.table("job_status").update({
            "progress": 90,
            "current_stage": "Saving notes..."
        }).eq("doc_id", doc_id).execute()

        generation_time = int(time.time() - start_time)

        supabase.table("notes").insert({
            "doc_id": doc_id,
            "title": notes["title"],
            "content": notes,
            "generation_time_seconds": generation_time
        }).execute()

        # Update document status
        supabase.table("documents").update({
            "status": "completed"
        }).eq("id", doc_id).execute()

        supabase.table("job_status").update({
            "status": "completed",
            "progress": 100,
            "current_stage": "Notes generated successfully!"
        }).eq("doc_id", doc_id).execute()

    except Exception as e:
        supabase.table("documents").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", doc_id).execute()

        supabase.table("job_status").update({
            "status": "failed",
            "current_stage": f"Error: {str(e)}"
        }).eq("doc_id", doc_id).execute()
```

### Step 3.5: Update Main App

```python
# app/main.py (ADD notes router)
from app.api.routes import upload, status, notes

app.include_router(notes.router)
```

### Step 3.6: Frontend Integration

Update the dashboard to call backend APIs:

```typescript
// frontend/app/chat/page.tsx (UPDATE)
"use client"
import { useState } from "react";
import Dashboard from "@/components/dashboard";

export default function ChatPage() {
  return <Dashboard />;
}
```

```typescript
// frontend/components/dashboard.tsx (UPDATE handleUpload)

const handleUpload = async () => {
    setViewState('processing');

    // In a real implementation, trigger file upload
    // For now, simulate with mock data

    // TODO: Replace with actual file upload
    // const formData = new FormData();
    // formData.append('file', selectedFile);
    //
    // const response = await fetch('http://localhost:8000/api/upload', {
    //     method: 'POST',
    //     body: formData
    // });
    //
    // const { doc_id } = await response.json();
    // pollStatus(doc_id);

    // For now, use mock delay
    setTimeout(() => handleProcessComplete(), 4000);
};
```

Create a proper upload implementation:

```typescript
// frontend/lib/api.ts (NEW FILE)
const API_BASE = 'http://localhost:8000';

export async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

export async function checkStatus(docId: string) {
  const response = await fetch(`${API_BASE}/api/status/${docId}`);
  return response.json();
}

export async function generateNotes(docId: string) {
  const response = await fetch(`${API_BASE}/api/notes/generate/${docId}`, {
    method: 'POST',
  });
  return response.json();
}

export async function getNotes(docId: string) {
  const response = await fetch(`${API_BASE}/api/notes/${docId}`);
  return response.json();
}
```

### ✅ Phase 3 Test - Complete End-to-End

**Test the full pipeline:**

```bash
# Terminal 1: Run backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Run frontend
cd frontend
npm run dev
```

**Manual E2E Test:**

1. **Upload PDF via API:**
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@test_lecture.pdf"

# Save doc_id
```

2. **Wait for processing (poll status):**
```bash
# Run this multiple times until status = "ready"
curl http://localhost:8000/api/status/{doc_id}
```

3. **Trigger note generation:**
```bash
curl -X POST http://localhost:8000/api/notes/generate/{doc_id}
```

4. **Poll until notes are ready:**
```bash
# Run until status = "completed"
curl http://localhost:8000/api/status/{doc_id}
```

5. **Retrieve generated notes:**
```bash
curl http://localhost:8000/api/notes/{doc_id}

# You should get a JSON response with:
# {
#   "doc_id": "...",
#   "notes": {
#     "title": "...",
#     "summary": "...",
#     "keyTerms": [...],
#     "sections": [...]
#   },
#   "generated_at": "..."
# }
```

**Frontend Test:**

1. Go to `http://localhost:3000`
2. Click "Upload PDF" button
3. This will navigate to `/chat`
4. In a real implementation:
   - Add file picker to UploadView
   - Call `uploadPDF()` from api.ts
   - Poll status and show progress
   - Auto-trigger note generation when ready
   - Display notes in NoteView component

✅ **Phase 3 Complete** when you can:
- Upload a PDF via API
- See it process automatically
- Generate comprehensive notes
- Retrieve structured JSON notes

---

## Complete Test Checklist

### ✅ System is Working When:

- [ ] Backend starts without errors (`uvicorn app.main:app`)
- [ ] Can upload PDF via `/api/upload`
- [ ] Document appears in Supabase `documents` table
- [ ] PDF processing completes (status = "ready")
- [ ] Chunks appear in Pinecone dashboard
- [ ] Can trigger `/api/notes/generate/{doc_id}`
- [ ] Notes generation completes (status = "completed")
- [ ] Can retrieve notes via `/api/notes/{doc_id}`
- [ ] Notes contain: title, summary, keyTerms, sections
- [ ] Frontend loads at `localhost:3000`
- [ ] Can navigate to `/chat` route

---

## Troubleshooting

### Common Issues

**1. "Supabase connection failed"**
- Check `.env` has correct `SUPABASE_URL` and keys
- Verify tables are created in Supabase SQL Editor

**2. "Pinecone index not found"**
- Go to Pinecone dashboard, create index manually:
  - Name: `notes-ai`
  - Dimensions: `1536`
  - Metric: `cosine`

**3. "Claude API error"**
- Verify `ANTHROPIC_API_KEY` in `.env`
- Check API credits at console.anthropic.com

**4. "OpenAI embedding failed"**
- Verify `OPENAI_API_KEY` in `.env`
- Check API credits at platform.openai.com

**5. "PDF processing stuck"**
- Check backend logs for errors
- Verify PDF is text-based (not scanned image)
- Try smaller PDF first (< 10 pages)

---

## Next Steps After MVP

Once all 3 phases pass:

1. **Frontend File Upload**: Add actual file picker to UploadView
2. **Real-time Progress**: WebSocket for live status updates
3. **Error Handling**: User-friendly error messages
4. **Note Rendering**: Beautiful typography with EB Garamond/Inter
5. **Export**: PDF/Markdown export functionality
6. **Authentication**: User accounts and document ownership
7. **Deployment**: Deploy to Vercel (frontend) + Railway/Render (backend)

---

## Environment Variables Summary

```bash
# .env (Backend)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
PINECONE_API_KEY=xxx
PINECONE_ENVIRONMENT=us-east-1

MAX_FILE_SIZE_MB=50
UPLOAD_DIR=./uploads
```

---

## Success Criteria

**MVP is complete when you can:**

1. Upload a lecture PDF (via API or frontend)
2. Automatically process it (extract → chunk → embed → store)
3. Generate comprehensive, aesthetic notes using Claude
4. Retrieve beautifully structured notes (JSON)
5. Display notes in the frontend dashboard

**Time Estimate:**
- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 4-5 hours
- **Total: ~10-12 hours** for a working MVP

Good luck! 🚀
