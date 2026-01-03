const API_BASE = 'http://localhost:8000';

export interface UploadResponse {
  doc_id: string;
  status: string;
  message: string;
}

export interface JobStatus {
  doc_id: string;
  status: string;
  progress: number;
  current_stage: string | null;
}

export interface NoteResponse {
  doc_id: string;
  notes: {
    title: string;
    summary: string;
    keyTerms: Array<{ term: string; definition: string }>;
    sections: Array<{
      heading: string;
      introduction: string;
      subsections: Array<{
        subheading: string;
        points: string[];
        examples?: string[];
        formulas?: Array<{ formula: string; explanation: string }>;
      }>;
      keyTerms?: Array<{ term: string; definition: string }>;
    }>;
  };
  generated_at: string;
}

export async function uploadPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export async function checkStatus(docId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/api/status/${docId}`);

  if (!response.ok) {
    throw new Error('Failed to check status');
  }

  return response.json();
}

export async function generateNotes(docId: string): Promise<{ doc_id: string; status: string; message: string }> {
  const response = await fetch(`${API_BASE}/api/notes/generate/${docId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Generation failed' }));
    throw new Error(error.detail || 'Note generation failed');
  }

  return response.json();
}

export async function getNotes(docId: string): Promise<NoteResponse> {
  const response = await fetch(`${API_BASE}/api/notes/${docId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }

  return response.json();
}
