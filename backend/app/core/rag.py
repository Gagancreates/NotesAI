from app.services.pinecone_client import PineconeClient
from app.services.claude_client import ClaudeClient
from typing import List, Dict
import json

SYSTEM_PROMPT = """You are an expert educational content creator specializing in comprehensive, aesthetic study notes.

YOUR TASK: Transform lecture content into detailed, beautifully structured notes that preserve ALL information while enhancing clarity.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "heading": "Section title",
  "introduction": "Brief context for this section",
  "subsections": [
    {
      "subheading": "Subtopic name",
      "points": ["Detailed point 1", "Detailed point 2"],
      "examples": ["Complete example with explanation"],
      "formulas": [
        {
          "formula": "Mathematical expression",
          "explanation": "What it means"
        }
      ]
    }
  ],
  "keyTerms": [
    {"term": "Exact term", "definition": "Complete definition"}
  ]
}

REQUIREMENTS:
- Include most information
- Preserve all definitions, formulas, examples
- Use clear hierarchical structure
- Make it exam-ready and aesthetically formatted"""

class RAGEngine:
    def __init__(self):
        self.pinecone_client = PineconeClient()
        self.claude_client = ClaudeClient()

    def generate_comprehensive_notes(self, doc_id: str) -> Dict:
        """
        Generate comprehensive notes using Map-Reduce pattern
        """
        # Step 1: Retrieve all chunks
        chunks = self.pinecone_client.fetch_all(doc_id)

        if not chunks:
            raise Exception("No chunks found for this document")

        # Sort by page and chunk index
        chunks = sorted(chunks, key=lambda x: (x["page"], x["chunk_index"]))

        # Step 2: Group by sections (by heading or page ranges)
        sections = self._group_by_section(chunks)

        # Step 3: MAP - Generate notes for each section
        section_notes = []
        for section_name, section_chunks in sections.items():
            notes = self._generate_section_notes(section_name, section_chunks)
            section_notes.append(notes)

        # Step 4: REDUCE - Combine into final structure
        final_notes = self._combine_sections(section_notes, chunks[0].get("heading", "Lecture Notes"))

        return final_notes

    def _group_by_section(self, chunks: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Group chunks by section (heading or page ranges)
        """
        sections = {}
        current_section = None
        section_chunks = []

        for chunk in chunks:
            heading = chunk.get("heading")

            # Start new section if we find a heading
            if heading and heading != current_section:
                if current_section and section_chunks:
                    sections[current_section] = section_chunks
                current_section = heading
                section_chunks = [chunk]
            else:
                # No heading - group by page ranges (every 3-5 pages)
                if not current_section:
                    current_section = f"Section (Pages {chunk['page']}-{chunk['page']+2})"
                section_chunks.append(chunk)

                # Create new section every 5 pages
                if len(section_chunks) >= 10:  # ~10 chunks ≈ 5 pages
                    sections[current_section] = section_chunks
                    current_section = None
                    section_chunks = []

        # Add remaining chunks
        if current_section and section_chunks:
            sections[current_section] = section_chunks

        return sections

    def _generate_section_notes(self, section_name: str, chunks: List[Dict]) -> Dict:
        """
        Generate notes for a single section using Claude
        """
        # Combine chunk texts
        context = "\n\n".join([
            f"[Page {chunk['page']}]\n{chunk['text']}"
            for chunk in chunks
        ])

        user_prompt = f"""Generate comprehensive notes for this section.

SECTION: {section_name}

CONTENT:
{context}

Remember:
- Include most information 
- Preserve all definitions, formulas, examples
- Maintain logical flow
- Return valid JSON only (no markdown, no code blocks)"""

        try:
            notes = self.claude_client.generate_structured(SYSTEM_PROMPT, user_prompt)
            return notes
        except Exception as e:
            # Fallback structure if parsing fails
            return {
                "heading": section_name,
                "introduction": "Error processing section",
                "subsections": [],
                "keyTerms": []
            }

    def _combine_sections(self, section_notes: List[Dict], title: str) -> Dict:
        """
        Combine all section notes into final structure
        """
        # Merge all key terms
        all_key_terms = []
        for section in section_notes:
            all_key_terms.extend(section.get("keyTerms", []))

        # Deduplicate key terms
        unique_terms = {term["term"]: term for term in all_key_terms}
        key_terms = list(unique_terms.values())

        # Generate executive summary
        summary = self._generate_summary(section_notes)

        return {
            "title": title or "Lecture Notes",
            "summary": summary,
            "keyTerms": key_terms,
            "sections": section_notes
        }

    def _generate_summary(self, section_notes: List[Dict]) -> str:
        """
        Generate brief executive summary from all sections
        """
        headings = [section.get("heading", "Section") for section in section_notes]

        summary_prompt = f"""Based on these section headings, write a 2-3 sentence executive summary of what this lecture covers:

{', '.join(headings)}

Return ONLY the summary text (no JSON, no formatting)."""

        try:
            return self.claude_client.generate(
                "You are a concise summarizer.",
                summary_prompt,
                max_tokens=200
            ).strip()
        except:
            return f"This lecture covers {len(section_notes)} main topics including {', '.join(headings[:3])}."