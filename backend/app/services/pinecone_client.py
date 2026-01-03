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
        # Store chunks with embeddings in Pinecone
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