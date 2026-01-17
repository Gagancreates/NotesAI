# NotesAI

An AI-powered study guide generator that transforms lecture PDFs into beautifully formatted, comprehensive study notes.

## Overview

NotesAI helps students convert their lecture slides and PDFs into aesthetic, exam-ready study guides. Unlike simple summarization tools, NotesAI preserves all lecture content while restructuring it for optimal learning with key terms, organized sections, examples, and quiz questions.

## Features

- **PDF Upload and Processing**: Upload lecture PDFs up to 50MB for automatic processing
- **Intelligent Text Extraction**: Preserves document structure including headings, formulas, and page references
- **RAG Pipeline**: Retrieval-Augmented Generation architecture using Pinecone vector storage and Claude for accurate, context-aware note generation
- **AI-Powered Note Generation**: Uses Claude with a Map-Reduce pattern to generate comprehensive, well-structured notes
- **Real-time Progress Tracking**: Monitor processing status as your notes are generated
- **Clean Typography**: Premium fonts (EB Garamond, Inter) for readable, aesthetic output

## Tech Stack

### Frontend
- Next.js 16 with React 19
- TypeScript
- Tailwind CSS 4
- Lucide React icons

### Backend
- FastAPI (Python 3.11)
- Anthropic Claude API (claude-sonnet-4-5-20250929)
- OpenAI Embeddings (text-embedding-3-small)
- Pinecone Vector Database
- Supabase (PostgreSQL)
- PyMuPDF for PDF processing

## Project Structure

```
notes_ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── api/routes/          # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── core/                # Config, database, RAG engine
│   │   └── models/              # Pydantic schemas
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                     # Next.js pages and layouts
│   ├── components/              # React components
│   ├── lib/                     # Utilities and API client
│   ├── package.json
│   └── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys for: Supabase, Anthropic, OpenAI, Pinecone

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:8000`.

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `OPENAI_API_KEY` | OpenAI API key for embeddings |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_ENVIRONMENT` | Pinecone environment (e.g., us-east-1) |
| `MAX_FILE_SIZE_MB` | Maximum upload file size (default: 50) |
| `UPLOAD_DIR` | Directory for uploaded files |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload a PDF file |
| `GET` | `/api/status/{doc_id}` | Check processing status |
| `POST` | `/api/notes/generate/{doc_id}` | Trigger note generation |
| `GET` | `/api/notes/{doc_id}` | Retrieve generated notes |
| `GET` | `/health` | Health check |

## Deployment

### Backend (Render)

1. Connect your GitHub repository to Render
2. Set root directory to `backend`
3. Configure build command: `pip install -r requirements.txt`
4. Configure start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `.env.example`

### Frontend (Vercel)

1. Import your repository to Vercel
2. Set root directory to `frontend`
3. Add `NEXT_PUBLIC_API_URL` environment variable pointing to your Render backend URL

## License

MIT
