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
      <div className="flex items-center justify-center py-6">
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
        content: chapterSummary.content || chapterSummary.text || "",
        depth: chapterSummary.depth,
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
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading chapters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
        Error loading chapters: {error.message}
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold">
          Chapters ({status.completedChapters}/{status.totalChapters})
        </h2>
        <div className="text-sm text-muted-foreground">
          {status.shouldStopPolling
            ? "All chapters processed"
            : "Processing chapters..."}
        </div>
      </div>

      <div className="space-y-4">
        {status.chapters.map((chapter: ChapterStatus) => {
          const isExpanded = expandedChapterIds.has(chapter.id);

          return (
            <div
              key={chapter.id}
              className={cn(
                "rounded-lg border transition-all",
                isExpanded ? "bg-muted/50" : ""
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={chapter.status} />
                  <span className="font-medium">{chapter.title}</span>
                </div>

                <div className="flex items-center gap-2 ml-11 sm:ml-0">
                  {chapter.status === "error" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(chapter.id)}
                      disabled={retryMutation.isPending}
                      className="w-full sm:w-auto"
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
                      className="w-full sm:w-auto"
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
