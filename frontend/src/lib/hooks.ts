import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookStatus, retryChapter, BookStatus, fetchSummary } from "./api";

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
  chapterId: string | undefined,
  depth: number = 1
) {
  return useQuery({
    queryKey: ["book", bookId, "chapter", chapterId, depth],
    queryFn: () => fetchSummary(bookId!, depth, chapterId),
    // Only run query if we have both IDs
    enabled: !!bookId && !!chapterId,
    // Don't refetch on window focus since content won't change
    refetchOnWindowFocus: false,
    select: (data) => ({
      id: chapterId!,
      title: `Chapter ${chapterId!.split("-")[1]}`,
      content: data.text,
      sections: data.sections.map((section) => ({
        ...section,
        content: "",
        sections: [],
        isExpanded: false,
      })),
      depth: data.depth || depth,
      status: "complete" as const,
    }),
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
