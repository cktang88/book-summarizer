import { useState, useEffect } from "react";
import { SummarySection } from "../types";
import { fetchSummary } from "../api";
import { summaryCache } from "../cache";

export function useSummary(bookId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummarySection | null>(null);

  useEffect(() => {
    async function loadInitialSummary() {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cachedContent = summaryCache.get(bookId, undefined, 1);
        if (cachedContent) {
          setSummary({
            id: "root",
            title: "Book Summary",
            content: cachedContent,
            depth: 0,
            sections: [],
          });
          setIsLoading(false);
          return;
        }

        // Fetch initial summary
        const response = await fetchSummary(bookId, 1);

        // Cache the summary
        summaryCache.set(bookId, undefined, 1, response.text);

        // Create initial summary structure
        setSummary({
          id: "root",
          title: "Book Summary",
          content: response.text,
          depth: 0,
          sections: response.sections.map((section) => ({
            ...section,
            content: "",
            depth: 1,
            sections: [],
          })),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialSummary();
  }, [bookId]);

  return {
    isLoading,
    error,
    summary,
  };
}
