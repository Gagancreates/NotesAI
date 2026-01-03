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