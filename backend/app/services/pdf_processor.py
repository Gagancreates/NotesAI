import fitz
from typing import List, Dict
import re

class Chunk:
    def __init__(self, text: str, page: int, chunk_index: int, heading: str = None):
        self.text = text
        self.page = page
        self.chunk_index = chunk_index
        self.heading = heading
        self.chunk_id = f"page{page}_chunk{chunk_index}"

class PDFProcessor:
    def __init__(self, max_tokens: int = 800, overlap: int = 200):
        self.max_tokens = max_tokens
        self.overlap = overlap

    def extract_and_chunk(self, pdf_path: str) -> List[Dict]:
        """
        Extract text from PDF and create semantic chunks
        """
        doc = fitz.open(pdf_path)
        chunks = []

        for page_num, page in enumerate(doc):
            # Extract text
            text = page.get_text()

            if not text.strip():
                continue

            # Detect heading (first line if it's short and bold)
            lines = text.split('\n')
            heading = lines[0] if lines and len(lines[0]) < 100 else None

            # Chunk the page text
            page_chunks = self._chunk_text(text, page_num + 1, heading)
            chunks.extend(page_chunks)

        doc.close()

        return [
            {
                "chunk_id": chunk.chunk_id,
                "text": chunk.text,
                "page": chunk.page,
                "heading": chunk.heading,
                "chunk_index": chunk.chunk_index
            }
            for chunk in chunks
        ]

    def _chunk_text(self, text: str, page: int, heading: str) -> List[Chunk]:
        """
        Split text into chunks with overlap
        """
        # Simple word-based chunking
        words = text.split()
        chunks = []
        chunk_index = 0

        # Approximate tokens (1 token ≈ 0.75 words)
        words_per_chunk = int(self.max_tokens * 0.75)
        overlap_words = int(self.overlap * 0.75)

        i = 0
        while i < len(words):
            chunk_words = words[i:i + words_per_chunk]
            chunk_text = ' '.join(chunk_words)

            chunks.append(Chunk(
                text=chunk_text,
                page=page,
                chunk_index=chunk_index,
                heading=heading
            ))

            chunk_index += 1
            i += words_per_chunk - overlap_words

        return chunks

    def get_total_pages(self, pdf_path: str) -> int:
        """Get total number of pages in PDF"""
        doc = fitz.open(pdf_path)
        total = len(doc)
        doc.close()
        return total