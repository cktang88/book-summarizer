import {
  useBookStatus,
  useRetryChapter,
  useChapterSummary,
  useNonChapters,
  useDeleteChapterSummaries,
} from "@/lib/hooks";
import { ChapterStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SummaryViewer } from "./components/SummaryViewer";
import { Loader2, RefreshCw } from "lucide-react";

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
  const { data: nonChaptersData } = useNonChapters(bookId);
  const retryMutation = useRetryChapter(bookId);
  const deleteMutation = useDeleteChapterSummaries(bookId);

  const handleRetry = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation(); // Prevent card expansion when clicking retry
    try {
      await retryMutation.mutateAsync({ chapterId });
      toast.success("Chapter queued for retry");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to retry chapter";
      toast.error(message);
    }
  };

  const handleReSummarize = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation(); // Prevent card expansion when clicking re-summarize
    try {
      // Collapse the chapter section before deleting summaries
      onSelectChapter(chapterId);
      await deleteMutation.mutateAsync({ chapterId });
      toast.success("Chapter queued for re-summarization");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to re-summarize chapter";
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

  // Get the set of non-chapter IDs
  const nonChapterIds = new Set(nonChaptersData?.non_chapters || []);

  // Filter out non-chapters from the total count
  const validChapters = status.chapters.filter(
    (chapter) => !nonChapterIds.has(chapter.id)
  );
  const totalValidChapters = validChapters.length;
  const completedValidChapters = validChapters.filter(
    (chapter) => chapter.status === "complete"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold">
          Chapters ({completedValidChapters}/{totalValidChapters})
        </h2>
        <div className="text-sm text-muted-foreground">
          {status.shouldStopPolling
            ? "All chapters processed"
            : "Processing chapters..."}
        </div>
      </div>

      <div className="space-y-4">
        {status.chapters
          .filter((chapter) => !nonChapterIds.has(chapter.id))
          .map((chapter: ChapterStatus) => {
            const isExpanded = expandedChapterIds.has(chapter.id);

            console.log(`[ChapterList] Chapter ${chapter.id} status:`, {
              title: chapter.title,
              status: chapter.status,
              isExpanded,
            });

            return (
              <div
                key={chapter.id}
                className={cn(
                  "rounded-lg border transition-all duration-200",
                  "group relative",
                  isExpanded && "bg-muted/50"
                )}
              >
                <div
                  onClick={() =>
                    chapter.status !== "error" && onSelectChapter(chapter.id)
                  }
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3",
                    chapter.status !== "error" &&
                      "cursor-pointer hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {chapter.status === "error" ? (
                      <StatusBadge status="error" />
                    ) : chapter.status === "processing" ||
                      chapter.status === "pending" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 transition-colors duration-200",
                          "group-hover:border-muted-foreground/50",
                          isExpanded
                            ? "bg-muted-foreground/30 border-muted-foreground/50"
                            : "border-muted-foreground/30"
                        )}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium",
                          (chapter.status === "pending" ||
                            chapter.status === "processing") &&
                            "text-muted-foreground"
                        )}
                      >
                        {chapter.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-11 sm:ml-0">
                    {chapter.status === "error" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleRetry(e, chapter.id)}
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
                    ) : (
                      chapter.status === "complete" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleReSummarize(e, chapter.id)}
                          disabled={deleteMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          <RefreshCw
                            className={cn(
                              "mr-1 h-3 w-3",
                              deleteMutation.isPending && "animate-spin"
                            )}
                          />
                          {deleteMutation.isPending
                            ? "Re-summarizing..."
                            : "Re-summarize"}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="border-t p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
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
