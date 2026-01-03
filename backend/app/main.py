from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload, status, notes

app = FastAPI(title="NoteAI API", version="1.0.0", description="PDF to Aesthetic Notes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
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

