# route for uploading the pdf
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.models.schemas import UploadResponse
from app.core.database import get_supabase
from app.core.config import get_settings
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/api", tags=["upload"])
settings = get_settings()

os.makedirs(settings.upload_dir, exist_ok=True)

@router.post("/upload", response_model = UploadResponse)
async def upload_pdf(
    file: UploadFile =File(...),
    background_tasks: BackgroundTasks = None
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF file type is supported")

    # reading the file
    contents=await file.read()
    file_size=len(contents)

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