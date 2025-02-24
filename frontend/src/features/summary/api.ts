import { SummaryResponse } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

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

  return response.json();
}
