import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload, status, notes
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NoteAI API", version="1.0.0", description="PDF to Aesthetic Notes")

# Get allowed origins from environment variable
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [frontend_url, "http://localhost:3000"]  # Always allow localhost for development

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(status.router)
app.include_router(notes.router)

@app.get("/")
async def root():
    return {"message": "NotesAI API v1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

