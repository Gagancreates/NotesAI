# defining the schemas for our rag pipeline

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

class NoteGenerationResponse(BaseModel):
    doc_id: UUID
    status: str
    message: str

class NoteResponse(BaseModel):
    doc_id: UUID
    notes: Dict[str, Any]
    generated_at: datetime
