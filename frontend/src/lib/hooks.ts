import {
  useQuery,
  useMutation,
  useQueryClient,
  Query,
} from "@tanstack/react-query";
import { getBookStatus, retryChapter, BookStatus, fetchSummary } from "./api";

export function useBookStatus(bookId: string | null) {
  return useQuery({
    queryKey: ["book", bookId, "status"],
    queryFn: async () => {
      console.log(`[useBookStatus] Fetching status for book ${bookId}`);
      try {
        const status = await getBookStatus(bookId!);
        console.log(
          `[useBookStatus] Received status for book ${bookId}:`,
          status,
          "\nChapter statuses:",
          status.chapters.map((ch) => `${ch.id}: ${ch.status}`)
        );
        return status;
      } catch (error) {
        console.error(
          `[useBookStatus] Error fetching status for book ${bookId}:`,
          error
        );
        throw error;
      }
    },
    // Only run query if we have a bookId
    enabled: !!bookId,
    // Poll every 2 seconds
    refetchInterval: (query: Query<BookStatus, Error>) => {
      const data = query.state.data;
      if (!data) return 2000;

      const hasChapters = data.totalChapters > 0;
      const allComplete =
        hasChapters && data.completedChapters === data.totalChapters;
      const hasProcessingChapters = data.chapters.some(
        (ch: { status: string }) =>
          ch.status === "processing" || ch.status === "pending"
      );

      // Keep polling if:
      // 1. We have no chapters yet (initial state)
      // 2. We have chapters that are still processing/pending
      // 3. Not all chapters are complete
      if (!hasChapters || hasProcessingChapters || !allComplete) {
        return 2000;
      }

      console.log(
        `[useBookStatus] Stopping polling - all chapters complete and no processing`
      );
      return false;
    },
    // Stop polling when window is in background
    refetchIntervalInBackground: false,
    select: (data: BookStatus) => {
      const hasChapters = data.totalChapters > 0;
      const allComplete =
        hasChapters && data.completedChapters === data.totalChapters;
      const hasProcessingChapters = data.chapters.some(
        (ch: { status: string }) =>
          ch.status === "processing" || ch.status === "pending"
      );

      console.log(
        `[useBookStatus] Processing status data for book ${bookId}:`,
        {
          completedChapters: data.completedChapters,
          totalChapters: data.totalChapters,
          hasChapters,
          allComplete,
          hasProcessingChapters,
        }
      );

      return {
        ...data,
        shouldStopPolling: hasChapters && allComplete && !hasProcessingChapters,
      };
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
      content: data.text || data.content,
      text: data.text || data.content,
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
