from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import NoteGenerationResponse, NoteResponse
from app.core.rag import RAGEngine
from app.core.database import get_supabase
from uuid import UUID
import time

router = APIRouter(prefix="/api/notes", tags=["notes"])

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
        error_msg = str(e)
        supabase.table("documents").update({
            "status": "failed",
            "error_message": error_msg
        }).eq("id", doc_id).execute()

        # Truncate error for job_status (max 100 chars)
        short_error = error_msg[:97] + "..." if len(error_msg) > 100 else error_msg
        supabase.table("job_status").update({
            "status": "failed",
            "current_stage": f"Error: {short_error}"
        }).eq("doc_id", doc_id).execute()