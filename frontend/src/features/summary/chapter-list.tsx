import { useBookStatus, useRetryChapter, useChapterSummary } from "@/lib/hooks";
import { ChapterStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SummaryViewer } from "./components/SummaryViewer";
import { Loader2 } from "lucide-react";

interface ChapterSummaryProps {
  bookId: string;
  chapterId: string;
}

function ChapterSummarySection({ bookId, chapterId }: ChapterSummaryProps) {
  const { data: chapterSummary, isLoading } = useChapterSummary(
    bookId,
    chapterId,
    1
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!chapterSummary) {
    return null;
  }

  return (
    <SummaryViewer
      bookId={bookId}
      initialSummary={{
        id: chapterSummary.id,
        title: chapterSummary.title,
        content: chapterSummary.content || "",
        depth: chapterSummary.depth,
        sections:
          chapterSummary.sections?.map((section) => ({
            ...section,
            content: "",
            sections: section.sections || [],
            isExpanded: false,
          })) || [],
        isExpanded: false,
      }}
    />
  );
}

interface ChapterListProps {
  bookId: string;
  onSelectChapter: (chapterId: string) => void;
  expandedChapterIds: Set<string>;
}

export function ChapterList({
  bookId,
  onSelectChapter,
  expandedChapterIds,
}: ChapterListProps) {
  const { data: status, isLoading, error } = useBookStatus(bookId);
  const retryMutation = useRetryChapter(bookId);

  const handleRetry = async (chapterId: string) => {
    try {
      await retryMutation.mutateAsync({ chapterId });
      toast.success("Chapter queued for retry");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to retry chapter";
      toast.error(message);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading chapters...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading chapters: {error.message}
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Chapters ({status.completedChapters}/{status.totalChapters})
        </h2>
        <div className="text-sm text-muted-foreground">
          {status.shouldStopPolling
            ? "All chapters processed"
            : "Processing chapters..."}
        </div>
      </div>

      <div className="space-y-2">
        {status.chapters.map((chapter: ChapterStatus) => {
          const isExpanded = expandedChapterIds.has(chapter.id);

          return (
            <div
              key={chapter.id}
              className={cn(
                "rounded-lg border transition-all",
                isExpanded ? "bg-muted" : ""
              )}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={chapter.status} />
                  <span>{chapter.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  {chapter.status === "error" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(chapter.id)}
                      disabled={retryMutation.isPending}
                    >
                      <ReloadIcon
                        className={cn(
                          "mr-1 h-3 w-3",
                          retryMutation.isPending && "animate-spin"
                        )}
                      />
                      {retryMutation.isPending ? "Retrying..." : "Retry"}
                    </Button>
                  )}
                  {chapter.status === "complete" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectChapter(chapter.id)}
                    >
                      {isExpanded ? "Hide" : "View"}
                    </Button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t p-4">
                  <ChapterSummarySection
                    bookId={bookId}
                    chapterId={chapter.id}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
