from fastapi import APIRouter, HTTPException
from app.models.schemas import JobStatusResponse
from app.core.database import get_supabase
from uuid import UUID

router = APIRouter(prefix="/api", tags=["status"])

@router.get("/status/{doc_id}", response_model= JobStatusResponse)
async def get_status(doc_id: UUID):
    supabase= get_supabase()

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