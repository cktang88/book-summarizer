import { ChapterList } from "../chapter-list";
import { useState } from "react";

interface SummaryPageProps {
  bookId: string;
}

export function SummaryPage({ bookId }: SummaryPageProps) {
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(
    new Set()
  );

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
