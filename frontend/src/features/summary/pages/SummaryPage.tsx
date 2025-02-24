import { ChapterList } from "../chapter-list";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBook } from "@/features/books/api/books-service";

interface SummaryPageProps {
  bookId: string;
}

export function SummaryPage({ bookId }: SummaryPageProps) {
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(
    new Set()
  );

  // Fetch book details to initialize queue
  useQuery({
    queryKey: ["book", bookId],
    queryFn: () => fetchBook(bookId),
    // Only fetch once when book is selected
    staleTime: Infinity,
  });

  const handleToggleChapter = (chapterId: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <ChapterList
        bookId={bookId}
        onSelectChapter={handleToggleChapter}
        expandedChapterIds={expandedChapterIds}
      />
    </div>
  );
}
