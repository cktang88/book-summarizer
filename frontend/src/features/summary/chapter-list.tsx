import { useBookStatus, useRetryChapter } from "@/lib/hooks";
import { ChapterStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChapterListProps {
  bookId: string;
  onSelectChapter?: (chapterId: string) => void;
  selectedChapterId?: string;
}

export function ChapterList({
  bookId,
  onSelectChapter,
  selectedChapterId,
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
        {status.chapters.map((chapter: ChapterStatus) => (
          <div
            key={chapter.id}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3",
              selectedChapterId === chapter.id && "bg-muted"
            )}
          >
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
                  onClick={() => onSelectChapter?.(chapter.id)}
                >
                  View
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
