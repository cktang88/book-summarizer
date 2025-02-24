import { SummaryCacheEntry } from "./types";

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class SummaryCache {
  private cache: Map<string, SummaryCacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  private getCacheKey(
    bookId: string,
    sectionId: string | undefined,
    depth: number
  ): string {
    return `${bookId}:${sectionId || "root"}:${depth}`;
  }

  get(
    bookId: string,
    sectionId: string | undefined,
    depth: number
  ): string | null {
    const key = this.getCacheKey(bookId, sectionId, depth);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache is expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      this.cache.delete(key);
      return null;
    }

    return entry.content;
  }

  set(
    bookId: string,
    sectionId: string | undefined,
    depth: number,
    content: string
  ): void {
    const key = this.getCacheKey(bookId, sectionId, depth);
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      depth,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const summaryCache = new SummaryCache();
