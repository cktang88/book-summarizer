import { Loader2 } from "lucide-react";
import { ChapterList } from "../chapter-list";
import { useState } from "react";
import { useChapterSummary } from "@/lib/hooks";

interface SummaryPageProps {
  bookId: string;
}

export function SummaryPage({ bookId }: SummaryPageProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<
    string | undefined
  >(undefined);
  const { data: chapterSummary, isLoading: isChapterLoading } =
    useChapterSummary(bookId, selectedChapterId);

  return (
    <div className="space-y-8">
      <ChapterList
        bookId={bookId}
        onSelectChapter={setSelectedChapterId}
        selectedChapterId={selectedChapterId}
      />

      {selectedChapterId && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-xl font-semibold">Chapter Summary</h2>
          {isChapterLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Loading summary...
                </p>
              </div>
            </div>
          ) : chapterSummary ? (
            <div className="prose dark:prose-invert">
              <p>{chapterSummary.content}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
