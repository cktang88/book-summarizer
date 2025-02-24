import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBookStatus,
  getChapterSummary,
  retryChapter,
  BookStatus,
} from "./api";

export function useBookStatus(bookId: string | null) {
  return useQuery({
    queryKey: ["book", bookId, "status"],
    queryFn: () => getBookStatus(bookId!),
    // Only run query if we have a bookId
    enabled: !!bookId,
    // Poll every 2 seconds
    refetchInterval: 2000,
    // Stop polling when all chapters are complete
    refetchIntervalInBackground: false,
    select: (data: BookStatus) => {
      const allComplete = data.completedChapters === data.totalChapters;
      // If all complete, return data but stop polling
      if (allComplete) {
        return { ...data, shouldStopPolling: true };
      }
      return { ...data, shouldStopPolling: false };
    },
  });
}

export function useChapterSummary(
  bookId: string | null,
  chapterId: string | null
) {
  return useQuery({
    queryKey: ["book", bookId, "chapter", chapterId],
    queryFn: () => getChapterSummary(bookId!, chapterId!),
    // Only run query if we have both IDs
    enabled: !!bookId && !!chapterId,
    // Don't refetch on window focus since content won't change
    refetchOnWindowFocus: false,
  });
}

export function useRetryChapter(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chapterId }: { chapterId: string }) =>
      retryChapter(bookId, chapterId),
    onSuccess: () => {
      // Invalidate the book status query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ["book", bookId, "status"],
      });
    },
  });
}
