# NotesAI - System Architecture

## Overview

NotesAI is an aesthetic note generation platform that transforms lecture PDFs into beautifully formatted, comprehensive study notes using RAG (Retrieval Augmented Generation) with Claude AI.

**Core Value Proposition:**
- **Aesthetics**: EB Garamond for headings (H1, H2, H3), Inter for body text
- **Completeness**: Comprehensive, detailed notes (not summaries) that preserve all lecture content
- **Intelligence**: RAG-powered generation using Claude API and Pinecone vector database

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components (Button, Card, Badge, etc.)
- **Fonts**: EB Garamond (headings), Inter (body)

### Backend
- **Framework**: FastAPI (Python)
- **Task Queue**: Celery + Redis
- **Database**: PostgreSQL (metadata, job status, generated notes)
- **Vector Database**: Pinecone (document embeddings)
- **LLM**: Claude API (Anthropic)
- **Embeddings**: OpenAI text-embedding-3-small

### Infrastructure
- **File Storage**: Local/S3 for PDF uploads
- **Caching**: Redis
- **Background Jobs**: Celery workers

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Landing Page │  │  Dashboard   │  │  Note Viewer │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    API Layer                          │   │
│  │  /upload  /status/{id}  /notes/generate/{id}        │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │              Business Logic Layer                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ PDF Processor│  │  RAG Engine  │  │   Claude   │ │   │
│  │  └──────────────┘  └──────────────┘  │   Client   │ │   │
│  │                                       └────────────┘ │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────┐ ┌────────────────┐
│  PostgreSQL  │ │ Pinecone │ │ Celery Workers │
│  (Metadata)  │ │ (Vectors)│ │    (Redis)     │
└──────────────┘ └──────────┘ └────────────────┘
```

---

## RAG Pipeline - Detailed Flow

### Phase 1: PDF Ingestion & Vectorization

```
User uploads PDF
      │
      ▼
┌─────────────────────────────────────────┐
│ 1. PDF Upload & Validation              │
│    - Check file type (.pdf)             │
│    - Check file size (< 50MB)           │
│    - Generate unique doc_id (UUID)      │
│    - Save to storage                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. Trigger Background Job (Celery)      │
│    - Return doc_id immediately          │
│    - Process asynchronously             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 3. Text Extraction (PyMuPDF)            │
│    - Extract text from each page        │
│    - Detect structure (headings, etc.)  │
│    - Identify formulas, diagrams        │
│    - OCR if needed                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 4. Intelligent Chunking                 │
│    Strategy:                            │
│    - Semantic boundaries (topics)       │
│    - 400-1000 tokens per chunk          │
│    - 200 token overlap                  │
│    - Preserve slide/section integrity   │
│                                         │
│    Output: Array of chunks with:        │
│    {                                    │
│      chunk_id: "page1_0",               │
│      text: "...",                       │
│      page: 1,                           │
│      heading: "Introduction",           │
│      chunk_type: "definition",          │
│      has_formula: true,                 │
│      chunk_index: 0                     │
│    }                                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 5. Generate Embeddings                  │
│    - Use OpenAI text-embedding-3-small  │
│    - 1536-dimensional vectors           │
│    - Batch process for efficiency       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 6. Store in Pinecone                    │
│    - Namespace: doc_id                  │
│    - Vector + metadata                  │
│    - Enable filtering by page, type     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 7. Update Job Status                    │
│    - Mark as "ready_for_generation"     │
│    - Store metadata in PostgreSQL       │
└─────────────────────────────────────────┘
```

---

## Phase 2: Comprehensive Note Generation (Map-Reduce Pattern)

### Why Map-Reduce?

For comprehensive notes that preserve all content:
- **Challenge**: PDFs can exceed Claude's context window
- **Solution**: Hierarchical generation
  1. **Map**: Generate detailed notes per section
  2. **Reduce**: Combine sections into final structured output

### Detailed Flow

```
User clicks "Generate Notes"
      │
      ▼
┌─────────────────────────────────────────┐
│ 1. Retrieve ALL Chunks from Pinecone    │
│    - Fetch entire doc_id namespace      │
│    - Sort chronologically (page order)  │
│    - ~50-200 chunks depending on PDF    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. Group Chunks by Section/Topic        │
│    Strategy:                            │
│    - Use heading metadata               │
│    - Detect topic boundaries            │
│    - Group related chunks               │
│                                         │
│    Output:                              │
│    sections = {                         │
│      "Introduction": [chunk1, chunk2],  │
│      "Topic 1": [chunk5, chunk6, ...],  │
│      "Topic 2": [chunk10, ...]          │
│    }                                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 3. MAP PHASE: Process Each Section      │
│                                         │
│    For each section:                    │
│      a) Combine chunk texts             │
│      b) Call Claude API with prompt:    │
│                                         │
│         "Generate comprehensive notes   │
│          for this section. Include      │
│          ALL details, definitions,      │
│          examples, formulas..."         │
│                                         │
│      c) Get structured JSON response:   │
│         {                               │
│           "heading": "...",             │
│           "subsections": [              │
│             {                           │
│               "subheading": "...",      │
│               "points": [...],          │
│               "examples": [...],        │
│               "formulas": [...]         │
│             }                           │
│           ],                            │
│           "keyTerms": [...]             │
│         }                               │
│                                         │
│    Execute in parallel for speed        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 4. REDUCE PHASE: Combine Sections       │
│                                         │
│    a) Merge all section_notes           │
│    b) Generate executive summary        │
│       (brief overview of full lecture)  │
│    c) Consolidate all key terms         │
│       (deduplicate, alphabetize)        │
│    d) Create quiz questions             │
│       (from all sections)               │
│                                         │
│    Final structure:                     │
│    {                                    │
│      "title": "Lecture X: ...",         │
│      "summary": "Brief overview",       │
│      "keyTerms": [...],                 │
│      "sections": [                      │
│        {section1_notes},                │
│        {section2_notes},                │
│        ...                              │
│      ],                                 │
│      "quiz": [...]                      │
│    }                                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 5. Save to Database                     │
│    - Store in PostgreSQL                │
│    - Cache in Redis                     │
│    - Return to frontend                 │
└─────────────────────────────────────────┘
```

---

## API Design

### FastAPI Endpoints

#### 1. Upload PDF

```http
POST /api/upload
Content-Type: multipart/form-data

Request:
- file: PDF file (< 50MB)

Response:
{
  "doc_id": "uuid",
  "status": "processing",
  "message": "PDF uploaded. Processing started."
}
```

**Flow:**
1. Validate PDF
2. Generate doc_id
3. Save file
4. Trigger Celery task
5. Return immediately

---

#### 2. Check Status

```http
GET /api/status/{doc_id}

Response:
{
  "doc_id": "uuid",
  "status": "processing" | "ready" | "generating" | "completed" | "failed",
  "progress": 65,
  "stage": "Generating embeddings",
  "chunks_processed": 45,
  "total_chunks": 67
}
```

**Statuses:**
- `processing`: PDF being chunked/embedded
- `ready`: Ready for note generation
- `generating`: Notes being generated
- `completed`: Notes ready
- `failed`: Error occurred

---

#### 3. Generate Notes

```http
POST /api/notes/generate/{doc_id}

Response:
{
  "doc_id": "uuid",
  "status": "generating",
  "message": "Note generation started"
}

// Then poll GET /api/notes/{doc_id} for result
```

---

#### 4. Get Generated Notes

```http
GET /api/notes/{doc_id}

Response:
{
  "doc_id": "uuid",
  "status": "completed",
  "notes": {
    "title": "Lecture 4: Renaissance",
    "summary": "...",
    "keyTerms": [
      {"term": "Humanism", "definition": "..."}
    ],
    "sections": [
      {
        "heading": "The Medici Influence",
        "introduction": "...",
        "subsections": [
          {
            "subheading": "Rise to Power",
            "points": [...],
            "examples": [...],
            "formulas": []
          }
        ]
      }
    ],
    "quiz": [...]
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

## Key Components

### 1. PDF Processor

**File:** `backend/app/services/pdf_processor.py`

**Responsibilities:**
- Extract text from PDF (PyMuPDF)
- Detect document structure (headings, bullets, formulas)
- Chunk intelligently by semantic boundaries
- Preserve metadata (page numbers, headings, types)

**Key Methods:**
```python
class PDFProcessor:
    def extract_and_chunk(pdf_path: str) -> List[Chunk]
    def parse_structure(blocks: List) -> StructuredContent
    def chunk_by_topics(content, min_tokens, max_tokens, overlap) -> List[Chunk]
    def contains_formula(text: str) -> bool
```

---

### 2. Embedding Service

**File:** `backend/app/services/embeddings.py`

**Responsibilities:**
- Generate vector embeddings for text chunks
- Batch processing for efficiency
- Handle API rate limits

**Key Methods:**
```python
class EmbeddingService:
    def embed(text: str) -> List[float]
    def embed_batch(texts: List[str]) -> List[List[float]]
```

**Model:** OpenAI `text-embedding-3-small` (1536 dimensions)

---

### 3. Pinecone Client

**File:** `backend/app/services/pinecone_client.py`

**Responsibilities:**
- Store document embeddings with metadata
- Retrieve chunks (all or by query)
- Manage namespaces (one per document)

**Key Methods:**
```python
class PineconeClient:
    def upsert_chunks(namespace: str, chunks: List[Chunk])
    def fetch_all(namespace: str) -> List[Chunk]
    def query(namespace: str, query_embedding: List[float], top_k: int)
    def delete_namespace(namespace: str)
```

**Index Configuration:**
- Dimension: 1536
- Metric: Cosine similarity
- Namespaces: One per doc_id

---

### 4. RAG Engine

**File:** `backend/app/core/rag.py`

**Responsibilities:**
- Orchestrate retrieval and generation
- Implement Map-Reduce pattern
- Assemble context for Claude

**Key Methods:**
```python
class RAGEngine:
    def retrieve_all_content(doc_id: str) -> List[Chunk]
    def group_by_section(chunks: List[Chunk]) -> Dict[str, List[Chunk]]
    def generate_section_notes(section_name: str, chunks: List[Chunk]) -> Dict
    def combine_sections(section_notes: List[Dict]) -> Dict
    def assemble_context(chunks: List[Chunk]) -> str
```

---

### 5. Claude Client

**File:** `backend/app/services/claude_client.py`

**Responsibilities:**
- Interface with Anthropic Claude API
- Manage prompts and responses
- Handle token limits and errors

**Key Methods:**
```python
class ClaudeClient:
    def generate(system: str, user: str, max_tokens: int) -> str
    def generate_structured(prompt: str, schema: Dict) -> Dict
```

**Model:** Claude 3.5 Sonnet (200k context window)

---

## Data Flow

### 1. Upload Flow

```
User → Frontend → FastAPI → Celery → Worker
                    ↓
                PostgreSQL (job created)

Worker → PyMuPDF → Chunks → OpenAI → Embeddings → Pinecone
   ↓
PostgreSQL (status: ready)
```

### 2. Generation Flow

```
User → Frontend → FastAPI → RAG Engine
                               ↓
                          Pinecone (fetch chunks)
                               ↓
                          Group by sections
                               ↓
                    ┌──────────┴──────────┐
                    ▼                     ▼
              Claude API            Claude API
              (Section 1)           (Section 2) ... (Parallel)
                    ▼                     ▼
                    └──────────┬──────────┘
                               ▼
                        Combine & Structure
                               ▼
                       PostgreSQL + Redis
                               ▼
                           Frontend
```

---

## Database Schema

### PostgreSQL Tables

#### documents
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    filename VARCHAR(255),
    file_size INTEGER,
    upload_timestamp TIMESTAMP,
    status VARCHAR(50), -- processing, ready, completed, failed
    total_pages INTEGER,
    total_chunks INTEGER,
    error_message TEXT
);
```

#### notes
```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY,
    doc_id UUID REFERENCES documents(id),
    title VARCHAR(500),
    content JSONB, -- Full note structure
    generated_at TIMESTAMP,
    generation_time_seconds INTEGER
);
```

#### processing_jobs
```sql
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY,
    doc_id UUID REFERENCES documents(id),
    job_type VARCHAR(50), -- embedding, generation
    status VARCHAR(50),
    progress INTEGER,
    current_stage VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Prompting Strategy

### System Prompt (Map Phase)

```
You are an expert educational content creator specializing in comprehensive,
aesthetic study notes.

YOUR TASK: Transform lecture content into detailed, beautifully structured
notes that preserve ALL information while enhancing clarity and organization.

REQUIREMENTS:
1. COMPLETENESS: Include every concept, definition, example, and formula
2. STRUCTURE: Use clear hierarchical organization
3. CLARITY: Explain complex concepts thoroughly
4. EXAM-READY: Format for effective studying

OUTPUT: JSON with this exact structure:
{
  "heading": "Section title",
  "introduction": "Brief context for this section",
  "subsections": [
    {
      "subheading": "Subtopic name",
      "points": ["Detailed point 1", "Detailed point 2", ...],
      "examples": ["Complete example with explanation"],
      "formulas": [
        {
          "formula": "Mathematical expression",
          "explanation": "What it means and when to use it",
          "variables": {"x": "description", ...}
        }
      ]
    }
  ],
  "keyTerms": [
    {"term": "Exact term", "definition": "Complete definition"}
  ]
}
```

### User Prompt (Map Phase)

```
Generate comprehensive, detailed notes for the following section.

SECTION: {section_name}

CONTENT:
{chunk_texts}

Remember:
- Include ALL information (don't summarize or skip)
- Preserve all definitions, formulas, examples
- Explain technical terms
- Maintain logical flow
- Create study-ready reference material
```

---

## File Structure

```
notes_ai/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── chat/
│   │   │   └── page.tsx          # Dashboard route
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui.tsx                # UI components
│   │   ├── dashboard.tsx         # Main dashboard
│   │   └── Sidebar.tsx           # Sidebar component
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── upload.py     # PDF upload endpoint
│   │   │       ├── notes.py      # Note generation
│   │   │       └── status.py     # Status polling
│   │   ├── core/
│   │   │   ├── config.py         # Environment config
│   │   │   ├── rag.py            # RAG engine
│   │   │   └── chunking.py       # Chunking logic
│   │   ├── services/
│   │   │   ├── pdf_processor.py  # PDF extraction
│   │   │   ├── embeddings.py     # Embedding service
│   │   │   ├── pinecone_client.py
│   │   │   └── claude_client.py
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic models
│   │   └── workers/
│   │       └── celery_worker.py  # Background tasks
│   ├── requirements.txt
│   └── .env
│
├── Architecture.md               # This file
└── README.md
```

---

## Scalability Considerations

### Current MVP Limitations
- Single PDF processing (no multi-document workspace)
- Sequential section processing in map phase
- Local file storage

### Future Enhancements
1. **Parallel Map Processing**: Process sections concurrently
2. **Caching**: Cache embeddings for frequently uploaded PDFs
3. **Streaming**: Stream Claude responses for real-time updates
4. **Multi-document**: Support multiple PDFs in one workspace
5. **Incremental Updates**: Add new slides without re-processing entire PDF

---

## Error Handling

### Upload Errors
- Invalid file type → 400 error
- File too large → 413 error
- Storage failure → 500 error, retry logic

### Processing Errors
- PDF extraction failure → Mark job as failed, notify user
- Embedding API failure → Retry with exponential backoff
- Pinecone timeout → Retry, fallback to partial processing

### Generation Errors
- Claude API failure → Retry with different prompts
- Token limit exceeded → Fall back to smaller chunks
- Invalid JSON response → Parse with error recovery

---

## Performance Metrics

### Target Metrics (MVP)
- **Upload Response**: < 500ms
- **PDF Processing**: 30-60 seconds for 50-page PDF
- **Note Generation**: 2-4 minutes for comprehensive notes
- **API Latency**: < 200ms for status checks

### Monitoring
- Track processing times per stage
- Monitor API call success rates
- Log token usage for cost optimization

---

## Security

### API Security
- Rate limiting on upload endpoint
- File type validation (magic bytes check)
- Max file size enforcement
- CORS configuration for frontend domain

### Data Privacy
- Document IDs are UUIDs (not sequential)
- PDFs deleted after processing (configurable retention)
- Notes stored encrypted at rest
- No user authentication in MVP (add later)

---

## Environment Variables

```bash
# Backend (.env)
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=notes-ai

DATABASE_URL=postgresql://user:pass@localhost/notesai
REDIS_URL=redis://localhost:6379/0

MAX_FILE_SIZE_MB=50
PDF_RETENTION_DAYS=7
```

---

## Development Workflow

### Local Setup
1. Start PostgreSQL and Redis
2. Start Celery worker: `celery -A app.workers.celery_worker worker`
3. Start FastAPI: `uvicorn app.main:app --reload`
4. Start Next.js: `npm run dev`

### Testing
- Unit tests for chunking logic
- Integration tests for RAG pipeline
- E2E tests for upload → generation flow

---

## Deployment Architecture (Future)

```
Users → Vercel (Next.js) → API Gateway
                              ↓
                         AWS ECS (FastAPI)
                              ↓
                    ┌─────────┴─────────┐
                    ▼                   ▼
              RDS PostgreSQL       ElastiCache Redis
                    ▼                   ▼
                Pinecone          Celery Workers (ECS)
                                       ▼
                                   S3 (PDFs)
```

---

## Conclusion

This architecture provides:
- ✅ **Scalability**: Map-Reduce handles large PDFs
- ✅ **Quality**: Comprehensive notes with all content preserved
- ✅ **Performance**: Async processing, parallel generation
- ✅ **Aesthetics**: Structured output ready for beautiful rendering
- ✅ **Maintainability**: Clean separation of concerns

The hierarchical Map-Reduce approach ensures we generate complete, detailed study notes while staying within API limits and maintaining high quality.
