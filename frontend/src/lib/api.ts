// API Types
export interface Chapter {
  title: string;
  sections?: Array<{
    title: string;
    level: number;
  }>;
}

export interface BookMetadata {
  title: string;
  chapters: Chapter[];
  format: string;
  pageCount?: number;
  author?: string;
  publishedDate?: string;
}

export interface UploadResponse {
  bookId: string;
  title: string;
  formats: ["text", "markdown"];
  metadata: BookMetadata;
}

export interface ChapterStatus {
  id: string;
  title: string;
  status: "pending" | "processing" | "complete" | "error";
  error?: string;
}

export interface BookStatus {
  totalChapters: number;
  completedChapters: number;
  chapters: ChapterStatus[];
}

export interface ChapterSummary {
  id: string;
  title: string;
  content: string | null;
  status: "pending" | "processing" | "complete" | "error";
  error?: string;
}

export interface SummaryResponse {
  text: string;
  sections: Array<{
    id: string;
    title: string;
  }>;
}

// API Client
const API_URL = import.meta.env.VITE_API_URL;

export async function uploadBook(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getBookStatus(bookId: string): Promise<BookStatus> {
  const response = await fetch(`${API_URL}/api/books/${bookId}/status`);

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.statusText}`);
  }

  return response.json();
}

export async function getChapterSummary(
  bookId: string,
  chapterId: string
): Promise<ChapterSummary> {
  const response = await fetch(
    `${API_URL}/api/books/${bookId}/chapters/${chapterId}/summary`
  );

  if (!response.ok) {
    throw new Error(`Failed to get summary: ${response.statusText}`);
  }

  return response.json();
}

export async function retryChapter(
  bookId: string,
  chapterId: string
): Promise<{ status: string }> {
  const response = await fetch(
    `${API_URL}/api/books/${bookId}/chapters/${chapterId}/retry`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(`Failed to retry chapter: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchSummary(
  bookId: string,
  depth: number,
  sectionId?: string
): Promise<SummaryResponse> {
  const params = new URLSearchParams({
    depth: depth.toString(),
    ...(sectionId && { section: sectionId }),
  });

  const response = await fetch(`${API_URL}/api/summary/${bookId}?${params}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch summary: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.text || "",
    sections: data.sections || [],
  };
}
